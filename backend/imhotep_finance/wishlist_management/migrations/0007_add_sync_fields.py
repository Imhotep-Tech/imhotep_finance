import uuid
from django.db import migrations, models


def backfill_wishlist_uuids(apps, schema_editor):
    """Assign a unique UUID to every existing Wishlist row."""
    Wishlist = apps.get_model('wishlist_management', 'Wishlist')
    for row in Wishlist.objects.filter(client_uuid=None):
        row.client_uuid = uuid.uuid4()
        row.save(update_fields=['client_uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('wishlist_management', '0006_wishlist_place'),
    ]

    operations = [
        migrations.AddField(
            model_name='wishlist',
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
            model_name='wishlist',
            name='updated_at',
            field=models.DateTimeField(
                auto_now=True,
            ),
        ),
        migrations.AddField(
            model_name='wishlist',
            name='is_deleted',
            field=models.BooleanField(
                default=False,
                db_index=True,
            ),
        ),
        # Backfill UUIDs for existing rows
        migrations.RunPython(
            backfill_wishlist_uuids,
            reverse_code=migrations.RunPython.noop,
        ),
        # Tighten to non-nullable with a default
        migrations.AlterField(
            model_name='wishlist',
            name='client_uuid',
            field=models.UUIDField(
                unique=True,
                default=uuid.uuid4,
                editable=False,
                db_index=True,
            ),
        ),
    ]
