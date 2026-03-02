export async function GET() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
}
