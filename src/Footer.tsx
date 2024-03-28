import { FOOTER_STYLE } from "./style"

const Footer = () => {
  const year = Date().slice(10, 16)
  return (
    <div className={FOOTER_STYLE}>
      <a href="https://github.com/nhexirc/client" target="_blank">{`nhex IRC client (${year})`}</a>
    </div>
  )
}

export default Footer
