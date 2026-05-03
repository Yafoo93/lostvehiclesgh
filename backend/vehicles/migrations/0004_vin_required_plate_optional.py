from django.db import migrations, models
from django.db.models import Q
from django.db.models.functions import Lower


def normalize_and_require_vin(apps, schema_editor):
    Vehicle = apps.get_model("vehicles", "Vehicle")
    missing_vin = []

    for vehicle in Vehicle.objects.all().iterator():
        plate_number = vehicle.plate_number.strip().upper() if vehicle.plate_number else None
        vin = vehicle.vin.strip().upper() if vehicle.vin else ""
        engine_number = (
            vehicle.engine_number.strip().upper() if vehicle.engine_number else None
        )

        if not vin:
            missing_vin.append(vehicle.pk)
            continue

        updates = {}
        if vehicle.plate_number != plate_number:
            updates["plate_number"] = plate_number
        if vehicle.vin != vin:
            updates["vin"] = vin
        if vehicle.engine_number != engine_number:
            updates["engine_number"] = engine_number

        if updates:
            Vehicle.objects.filter(pk=vehicle.pk).update(**updates)

    if missing_vin:
        raise ValueError(
            "Cannot require VIN because these vehicle IDs do not have one: "
            + ", ".join(str(pk) for pk in missing_vin)
        )


class Migration(migrations.Migration):

    dependencies = [
        ("vehicles", "0003_vehicle_identifier_constraints"),
    ]

    operations = [
        migrations.RunPython(normalize_and_require_vin, migrations.RunPython.noop),
        migrations.RemoveConstraint(
            model_name="vehicle",
            name="uniq_vehicle_plate_number_ci",
        ),
        migrations.RemoveConstraint(
            model_name="vehicle",
            name="uniq_vehicle_vin_ci",
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="plate_number",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Current registration/plate number, if available.",
                max_length=32,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="vin",
            field=models.CharField(
                db_index=True,
                help_text="Vehicle Identification Number.",
                max_length=64,
            ),
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                Lower("vin"),
                name="uniq_vehicle_vin_ci",
            ),
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.CheckConstraint(
                condition=~Q(vin=""),
                name="vehicle_vin_not_blank",
            ),
        ),
    ]
