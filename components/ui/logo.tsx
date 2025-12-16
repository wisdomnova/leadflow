import Link from 'next/link'
import Image from 'next/image'

export default function Logo() {
  return (
    <Link className="block flex justify-center" href="/">
      <Image
        src="/leadflow-large.png"
        alt="Leadflow"
        width={144}
        height={144}
        priority
      />
    </Link>
  )
}
