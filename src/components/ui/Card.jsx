// White rounded card container — the base visual block for dashboard sections.
//
// Usage:
//   <Card>
//     <Card.Header title="..." subtitle="..." action={<Button>...</Button>} />
//     <Card.Body>...</Card.Body>
//   </Card>

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between p-5 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

Card.Header = CardHeader
Card.Body = CardBody

export default Card
