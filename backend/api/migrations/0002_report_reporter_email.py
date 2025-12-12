from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="reporter_email",
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
