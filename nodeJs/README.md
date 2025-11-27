1. Open iac folder
Create resources:
- run docker-compose up

Execute migration if needed
*/scripts/migrate.ps1

Execute generator if needed
*/scripts/generate-prisma.ps1

2. Run Applications
- nx serve core-svc
- nx serve app-console