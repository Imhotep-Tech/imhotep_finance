import uuid
from django.db import migrations, models


def backfill_transaction_uuids(apps, schema_editor):
    """Assign a unique UUID to every existing Transactions row."""
    Transactions = apps.get_model('transaction_management', 'Transactions')
    for row in Transactions.objects.filter(client_uuid=None):
        row.client_uuid = uuid.uuid4()
        row.save(update_fields=['client_uuid'])


def backfill_networth_uuids(apps, schema_editor):
    """Assign a unique UUID to every existing NetWorth row."""
    NetWorth = apps.get_model('transaction_management', 'NetWorth')
    for row in NetWorth.objects.filter(client_uuid=None):
        row.client_uuid = uuid.uuid4()
        row.save(update_fields=['client_uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('transaction_management', '0009_networth_unique_user_currency_place'),
    ]

    operations = [
        # ---------- Transactions ----------
        migrations.AddField(
            model_name='transactions',
            name='client_uuid',
            field=models.UUIDField(
                null=True,          # temporarily nullable so existing rows don't break
                blank=True,
                unique=True,
                editable=False,
                db_index=True,
            ),
        ),
        migrations.AddField(
            model_name='transactions',
            name='updated_at',
            field=models.DateTimeField(
                auto_now=True,
            ),
        ),
        migrations.AddField(
            model_name='transactions',
            name='is_deleted',
            field=models.BooleanField(
                default=False,
                db_index=True,
            ),
        ),
        # Backfill UUIDs for existing rows
        migrations.RunPython(
            backfill_transaction_uuids,
            reverse_code=migrations.RunPython.noop,
        ),
        # Now tighten the column to non-nullable with a default
        migrations.AlterField(
            model_name='transactions',
            name='client_uuid',
            field=models.UUIDField(
                unique=True,
                default=uuid.uuid4,
                editable=False,
                db_index=True,
            ),
        ),

        # ---------- NetWorth ----------
        migrations.AddField(
            model_name='networth',
            name='client_uuid',
            field=models.UUIDField(
                null=True,
                blank=True,
                unique=True,
                editable=False,
                db_index=True,
            ),
        ),
        migrations.AddField(
            model_name='networth',
            name='updated_at',
            field=models.DateTimeField(
                auto_now=True,
            ),
        ),
        migrations.AddField(
            model_name='networth',
            name='is_deleted',
            field=models.BooleanField(
                default=False,
                db_index=True,
            ),
        ),
        # Backfill UUIDs for existing rows
        migrations.RunPython(
            backfill_networth_uuids,
            reverse_code=migrations.RunPython.noop,
        ),
        # Now tighten the column to non-nullable with a default
        migrations.AlterField(
            model_name='networth',
            name='client_uuid',
            field=models.UUIDField(
                unique=True,
                default=uuid.uuid4,
                editable=False,
                db_index=True,
            ),
        ),
    ]
