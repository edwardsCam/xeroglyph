export default function pushpop(s: any, fn: Function) {
  s.push()
  fn()
  s.pop()
}
