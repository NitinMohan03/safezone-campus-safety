from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_report_reporter_email"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="report",
            name="user",
        ),
        migrations.AddField(
            model_name="report",
            name="user_id",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
    ]
