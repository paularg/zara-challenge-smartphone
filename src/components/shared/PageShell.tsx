type PageShellProps = {
  headingId: string
  title: string
}

export const PageShell = ({ headingId, title }: PageShellProps) => (
  <section
    className="px-4 pt-6 md:px-10 md:pt-12 xl:px-[100px]"
    aria-labelledby={headingId}
  >
    <h1
      id={headingId}
      className="m-0 text-2xl leading-[1.2] font-light uppercase"
    >
      {title}
    </h1>
  </section>
)
