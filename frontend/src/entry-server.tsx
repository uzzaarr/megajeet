import { renderToString } from 'react-dom/server'

export function render() {
  return renderToString(
    <div
      data-loading-placeholder
      style={{
        minHeight: '100vh',
        background: '#ffffff',
      }}
    />
  )
}
