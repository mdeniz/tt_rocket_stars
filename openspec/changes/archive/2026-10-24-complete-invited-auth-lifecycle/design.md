# Design

The static client continues to use only the public Supabase Auth endpoints and
anonymous key. Rejected password credentials receive a generic localized
message that does not distinguish an unknown account from a wrong password.
Invitation and recovery token failures retain their existing expired-link
message. The E2E fixture simulates provider responses without storing or
printing credentials.

