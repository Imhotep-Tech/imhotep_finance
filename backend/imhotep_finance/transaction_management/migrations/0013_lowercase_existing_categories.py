from django.db import migrations


def lowercase_transaction_categories(apps, schema_editor):
    from transaction_management.models import Transactions
    for trans in Transactions.objects.all():
        if trans.category:
            lower_cat = str(trans.category).strip().lower()
            if trans.category != lower_cat:
                trans.category = lower_cat
                trans.save(update_fields=['category'])


class Migration(migrations.Migration):

    dependencies = [
        ('transaction_management', '0012_alter_networth_place'),
    ]

    operations = [
        migrations.RunPython(
            lowercase_transaction_categories,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
