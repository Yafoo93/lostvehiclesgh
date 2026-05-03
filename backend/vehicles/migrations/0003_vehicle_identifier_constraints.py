from django.db import migrations, models
from django.db.models import Q
from django.db.models.functions import Lower


def normalize_vehicle_identifiers(apps, schema_editor):
    Vehicle = apps.get_model("vehicles", "Vehicle")

    for vehicle in Vehicle.objects.all().iterator():
        plate_number = vehicle.plate_number.strip().upper()
        vin = vehicle.vin.strip().upper() if vehicle.vin else None
        engine_number = (
            vehicle.engine_number.strip().upper() if vehicle.engine_number else None
        )

        updates = {}
        if vehicle.plate_number != plate_number:
            updates["plate_number"] = plate_number
        if vehicle.vin != vin:
            updates["vin"] = vin
        if vehicle.engine_number != engine_number:
            updates["engine_number"] = engine_number

        if updates:
            Vehicle.objects.filter(pk=vehicle.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ("vehicles", "0002_vehicle_owner"),
    ]

    operations = [
        migrations.RunPython(normalize_vehicle_identifiers, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="vehicle",
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                Lower("plate_number"),
                name="uniq_vehicle_plate_number_ci",
            ),
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                Lower("vin"),
                condition=Q(vin__isnull=False) & ~Q(vin=""),
                name="uniq_vehicle_vin_ci",
            ),
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                Lower("engine_number"),
                condition=Q(engine_number__isnull=False) & ~Q(engine_number=""),
                name="uniq_vehicle_engine_number_ci",
            ),
        ),
    ]
