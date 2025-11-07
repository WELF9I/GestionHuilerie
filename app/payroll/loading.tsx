export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto"></div>
        <p className="text-muted-foreground">Chargement de la paie...</p>
      </div>
    </div>
  )
}
