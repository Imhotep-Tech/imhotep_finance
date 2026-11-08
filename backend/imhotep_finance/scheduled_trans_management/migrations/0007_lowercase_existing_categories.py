from django.db import migrations


def lowercase_scheduled_transaction_categories(apps, schema_editor):
    from scheduled_trans_management.models import ScheduledTransaction
    for sched in ScheduledTransaction.objects.all():
        if sched.category:
            lower_cat = str(sched.category).strip().lower()
            if sched.category != lower_cat:
                sched.category = lower_cat
                sched.save(update_fields=['category'])


class Migration(migrations.Migration):

    dependencies = [
        ('scheduled_trans_management', '0006_scheduledtransaction_place'),
    ]

    operations = [
        migrations.RunPython(
            lowercase_scheduled_transaction_categories,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
