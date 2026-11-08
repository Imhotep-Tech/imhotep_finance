import json
from django.db import migrations


def lowercase_report_categories(apps, schema_editor):
    from user_reports.models import Reports
    for report in Reports.objects.all():
        raw_data = report.data
        if not raw_data:
            continue
        try:
            data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        except (json.JSONDecodeError, TypeError):
            continue

        if not isinstance(data, dict):
            continue

        modified = False
        for range_key in ['user_deposit_on_range', 'user_withdraw_on_range']:
            if range_key in data and isinstance(data[range_key], list):
                consolidated = {}
                for item in data[range_key]:
                    raw_cat = item.get('category', '')
                    cat = raw_cat.strip().lower() if raw_cat and str(raw_cat).strip() else "uncategorized"
                    if cat != raw_cat:
                        modified = True
                    amt = float(item.get('converted_amount', 0))
                    consolidated[cat] = consolidated.get(cat, 0.0) + amt
                
                total = data.get('total_deposit' if range_key == 'user_deposit_on_range' else 'total_withdraw', 0)
                data[range_key] = [
                    {
                        "category": cat,
                        "converted_amount": amt,
                        "percentage": round((amt / total) * 100, 1) if total > 0 else 0.0
                    }
                    for cat, amt in consolidated.items()
                ]

        if modified:
            report.data = json.dumps(data)
            report.save(update_fields=['data'])


class Migration(migrations.Migration):

    dependencies = [
        ('user_reports', '0003_alter_reports_data'),
    ]

    operations = [
        migrations.RunPython(
            lowercase_report_categories,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
