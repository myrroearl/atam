export interface Announcement {
  notification_id: number
  account_id: number
  receiver: string
  receiver_role: string
  message: string
  type: string | null
  status: string | null
  created_at: string
}

