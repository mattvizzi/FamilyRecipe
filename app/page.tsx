export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">Your Web App</h1>
        <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
          A clean Next.js starter ready for GitHub and Vercel deployment. Start building your features from here.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Next.js Docs
          </a>
          <a
            href="https://vercel.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Vercel Docs
          </a>
        </div>
      </div>
    </main>
  )
}
