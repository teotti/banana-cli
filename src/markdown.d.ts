/** Bun imports a `.md` file as text, which is how the skill ships in the binary. */
declare module "*.md" {
  const contents: string;
  export default contents;
}
