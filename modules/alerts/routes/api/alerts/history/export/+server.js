export async function GET() {
	// Generate CSV
	const csv = 'Type,Username,Date\n';
	
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="alert-history.csv"'
		}
	});
}
