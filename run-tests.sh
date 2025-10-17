#!/bin/bash

# Test runner script for local development
# This script mimics the CI environment for testing

set -e

echo "🧪 Running Imhotep Finance Backend Tests"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Starting test environment..."

# Start PostgreSQL container for testing
echo "🐘 Starting PostgreSQL container..."
docker run -d --name test-postgres \
    -e POSTGRES_DB=imhotep_finance_db \
    -e POSTGRES_USER=imhotep_finance_user \
    -e POSTGRES_PASSWORD=imhotep_finance_password \
    -p 5433:5432 \
    postgres:15

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

until pg_isready -h localhost -p 5433 -U imhotep_finance_user -d imhotep_finance_db; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Set environment variables for testing
export DATABASE_HOST=localhost
export DATABASE_PORT=5433
export DATABASE_NAME=imhotep_finance_db
export DATABASE_USER=imhotep_finance_user
export DATABASE_PASSWORD=imhotep_finance_password
export SECRET_KEY=django-insecure-test-key
export DEBUG=True
export MAIL_PASSWORD=test-password
export GOOGLE_CLIENT_ID=test-client-id
export GOOGLE_CLIENT_SECRET=test-client-secret

# Run tests
echo "🧪 Running Django tests..."
cd backend/imhotep_finance

# Run migrations
echo "📊 Running migrations..."
python manage.py makemigrations accounts
python manage.py makemigrations finance_management
python manage.py makemigrations
python manage.py migrate

# Run the specific test that was mentioned
echo "🎯 Running finance_management.tests..."
python manage.py test finance_management.tests --verbosity=2

# Run all tests
echo "🎯 Running all Django tests..."
python manage.py test --verbosity=2

echo "✅ All tests completed successfully!"

# Cleanup
echo "🧹 Cleaning up..."
docker stop test-postgres
docker rm test-postgres

echo "🎉 Test run completed!"
