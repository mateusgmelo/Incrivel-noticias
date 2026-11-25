/** Marca do portal: símbolo + nome. O tamanho do símbolo acompanha o texto. */
// eslint-disable-next-line @next/next/no-img-element
const Mark = ({ size }: { size: number }) => <img src="/brand/logo.png" alt="" width={size} height={size} className="shrink-0 rounded-md" style={{ width: size, height: size }} />;

export function LogoMark({ size = 36 }: { size?: number }) {
  return <Mark size={size} />;
}
