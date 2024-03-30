import { FOOTER_STYLE } from "./style"
import gh from "./assets/gh.svg"

const Footer = () => {
  return (
    <div className={FOOTER_STYLE}>
      <a href="https://github.com/nhexirc/client" target="_blank">
        <img src={gh} className="w-8 mx-auto" alt="github" />
      </a>
    </div>
  )
}

export default Footer
