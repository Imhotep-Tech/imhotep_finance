#!/usr/bin/env python
"""
URL Testing Script for Imhotep Finance App Restructuring
This script tests both old and new URLs to ensure they're working correctly.
"""

import os
import sys
import django
import requests
from django.test import Client
from django.urls import reverse

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'imhotep_finance.settings')
django.setup()

def test_urls():
    """Test both old and new URLs to ensure they're working"""
    print("=" * 60)
    print("URL TESTING SCRIPT")
    print("=" * 60)
    
    # Test URLs to check
    test_cases = [
        # (description, old_url, new_url)
        ("Add Transaction", 
         "/api/finance-management/transaction/add-transactions/",
         "/api/transactions/transaction/add-transactions/"),
        
        ("Get Transactions", 
         "/api/finance-management/transaction/get-transactions/",
         "/api/transactions/transaction/get-transactions/"),
        
        ("Get NetWorth", 
         "/api/finance-management/get-networth/",
         "/api/finance-management/get-networth/"),  # This one stays the same
        
        ("Add Wish", 
         "/api/finance-management/wishlist/add-wish/",
         "/api/wishlist/wishlist/add-wish/"),
        
        ("Get Wishlist", 
         "/api/finance-management/wishlist/get-wishlist/",
         "/api/wishlist/wishlist/get-wishlist/"),
        
        ("Get Target", 
         "/api/finance-management/target/get-target/",
         "/api/targets/target/get-target/"),
        
        ("Get Monthly Report", 
         "/api/finance-management/reports/get-monthly-report/",
         "/api/reports/get-monthly-report/"),
    ]
    
    client = Client()
    
    print("Testing URL accessibility...")
    print("-" * 40)
    
    for description, old_url, new_url in test_cases:
        print(f"\n{description}:")
        
        # Test old URL
        try:
            response = client.get(old_url)
            old_status = f"✅ {response.status_code}" if response.status_code in [200, 301, 302, 403] else f"❌ {response.status_code}"
        except Exception as e:
            old_status = f"❌ Error: {str(e)[:50]}"
        
        # Test new URL
        try:
            response = client.get(new_url)
            new_status = f"✅ {response.status_code}" if response.status_code in [200, 301, 302, 403] else f"❌ {response.status_code}"
        except Exception as e:
            new_status = f"❌ Error: {str(e)[:50]}"
        
        print(f"  Old URL: {old_status}")
        print(f"  New URL: {new_status}")
    
    print("\n" + "=" * 60)
    print("URL TESTING COMPLETED")
    print("=" * 60)
    print("Note: 403/401 errors are expected for unauthenticated requests")
    print("The important thing is that URLs are accessible (not 404)")

if __name__ == "__main__":
    test_urls()
