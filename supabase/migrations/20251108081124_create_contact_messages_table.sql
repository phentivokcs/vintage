/*
  # Kapcsolati üzenetek tábla

  1. Új tábla
    - `contact_messages`
      - `id` (uuid, primary key)
      - `name` (text, feladó neve)
      - `email` (text, feladó email címe)
      - `subject` (text, tárgy)
      - `message` (text, üzenet szövege)
      - `status` (text, 'new' | 'read' | 'archived')
      - `created_at` (timestamptz)

  2. Biztonsági szabályok
    - Bárki írhat (új üzenet)
    - Csak authenticated users (admin) olvashatják

  3. Indexek
    - status szerint
    - dátum szerint
*/

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- Anyone can insert contact messages
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Authenticated users can view all messages
CREATE POLICY "Authenticated users can view all messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can update message status
CREATE POLICY "Authenticated users can update messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete messages
CREATE POLICY "Authenticated users can delete messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (true);