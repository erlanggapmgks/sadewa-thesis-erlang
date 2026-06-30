// Status badge chip — used to show request status everywhere in the app.
// Pass a raw status string and it looks up the label and color automatically.
//
// Usage:
//   <Badge status="pending" />        → yellow "Menunggu"
//   <Badge status="approved" />       → green "Disetujui"

import { getStatusLabel, getStatusColor } from '../../utils/formatStatus'

export default function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}
