# Make My Marriage
## Product Requirements Document — Version 1.0

**Product:** Make My Marriage  
**Version:** V1  
**Target Market:** India  
**Platform:** Responsive Web Application  
**Primary Users:** Bride and Groom  
**Secondary Users:** Family Members  
**Guest Authentication:** None  
**Pricing:** Free for couples and families  
**Future Revenue Direction:** Vendor-side monetization  
**Document Status:** Approved V1 Scope / Development Planning Baseline

---

# 1. Product Overview

Make My Marriage is an India-first collaborative wedding planning and management platform designed to help couples and their families organize complex, multi-event weddings from one shared workspace.

The application brings together wedding events, family coordination, tasks, budgets, expenses, guests, invitations, RSVPs, vendors, wedding websites, photo sharing, and livestream access.

The central product concept is:

> **One wedding, multiple events, one shared management platform.**

The bride and groom own the wedding workspace. Family members may join as Admins, Organizers, or Managers and collaborate on wedding preparation.

Guests do not create accounts. They interact with the platform through personalized invitation links, gallery links, QR-based photo upload links, and the public-facing wedding website.

---

# 2. Problem Statement

Indian weddings frequently involve multiple events, venues, vendors, family members, guest households, financial commitments, and planning activities.

Planning is commonly distributed across:

- WhatsApp groups
- Excel or Google Sheets
- Phone calls
- Personal notes
- Emails
- Vendor conversations
- Paper guest lists
- Separate invitation systems

This fragmentation creates several problems:

- Tasks are forgotten or duplicated.
- Different family members maintain different information.
- Guest counts become difficult to track.
- Expenses are scattered.
- Event schedules are difficult to communicate.
- Vendor information is fragmented.
- Couples lack a consolidated view of wedding preparation.
- Guests receive information through multiple disconnected channels.

Make My Marriage aims to provide one shared system for managing these activities.

---

# 3. Product Goals

V1 must enable a couple to:

1. Create and configure their wedding.
2. Add and manage multiple wedding events.
3. Invite family members to collaborate.
4. Assign wedding-related tasks.
5. Track budgets and expenses.
6. Manage guest households.
7. Send invitations through email.
8. Collect event-specific household RSVPs.
9. Discover and compare wedding vendors.
10. Manage selected vendors.
11. Create a wedding website.
12. Allow guests to upload wedding photos through QR codes.
13. Moderate and privately share approved photographs.
14. Embed YouTube livestreams for wedding events.
15. Monitor overall wedding preparation from a centralized dashboard.

---

# 4. Product Principles

### Couple-Owned

The bride and groom remain the primary owners of the wedding workspace.

### Family Collaborative

Wedding planning should support collaboration between trusted family members.

### Multi-Event First

The platform must treat an Indian wedding as a collection of events rather than a single ceremony.

### Guest-Friendly

Guests should not be forced to create accounts.

### Simple Before Complex

V1 should solve wedding coordination without introducing unnecessary financial, marketplace, communication, or AI complexity.

### Mobile-Friendly

Although V1 is a web application, guest-facing and organizer-facing experiences must work well on smartphones.

---

# 5. User Types

| User | Authentication | Description |
|---|---|---|
| Bride | Email + password | Wedding co-owner |
| Groom | Email + password | Wedding co-owner |
| Admin | Email + password | Trusted family member with administrative privileges |
| Organizer | Email + password | Family member participating in wedding operations |
| Manager | Email + password | Family member participating in wedding operations |
| Guest Representative | None | Primary invited member representing a guest household |
| Gallery Viewer | None | User possessing private gallery link |
| Photo Contributor | None | Person possessing photo-upload QR/link |

---

# 6. Role and Permission Model

## Bride and Groom

Bride and Groom are wedding co-owners.

They can:

- Access every wedding module.
- Edit wedding configuration.
- Manage family members.
- Manage events.
- Manage guests.
- Manage tasks.
- Manage expenses.
- Manage vendors.
- Manage invitations.
- View RSVP data.
- Configure the wedding website.
- Configure livestreams.
- Approve or reject uploaded photographs.
- Manage the gallery.

## Admin

Admins have access to all operational functionality and may manage Organizer and Manager accounts.

Admins may:

- Invite Organizers and Managers.
- Remove Organizers and Managers.
- Manage wedding information.
- Manage events.
- Manage guests.
- Manage expenses.
- Manage tasks.
- Manage vendors.
- Manage invitations.
- Approve or reject uploaded photographs.

Admins must not be able to remove the Bride or Groom as wedding owners.

## Organizer

Organizers may use all operational wedding-management functionality.

They cannot:

- Change wedding ownership.
- Manage Admin privileges.
- Approve pending guest-uploaded photographs.

## Manager

Managers have the same V1 operational permissions as Organizers.

The Manager and Organizer roles are therefore primarily organizational labels in V1 rather than distinct permission levels.

## Guests

Guests have no platform account and no formal application role.

Guests interact through secure links.

---

# 7. Authentication Requirements

### AUTH-01

Registered users must log in using email and password.

### AUTH-02

Users must verify their email when creating an account.

### AUTH-03

Users must be able to reset forgotten passwords.

### AUTH-04

Passwords must be stored securely using industry-standard password hashing.

### AUTH-05

Authenticated sessions must expire after an appropriate security period.

### AUTH-06

Wedding data must only be accessible to members associated with that wedding.

### AUTH-07

Bride and Groom accounts must not be removable by standard Admin users.

---

# 8. Wedding Setup

### WED-01

Bride or Groom must be able to create a wedding workspace.

### WED-02

Wedding setup must support:

- Wedding title
- Bride name
- Groom name
- Wedding start date
- Wedding end date
- Primary city/location
- Wedding description
- Cover photograph

### WED-03

Wedding information must be editable after creation.

### WED-04

A wedding must have at least one owner.

### WED-05

The other partner may be invited as a co-owner by email.

### WED-06

The system must support inviting family members through email.

---

# 9. Family Member Management

### FAM-01

Bride, Groom, or Admin must be able to invite family members by email.

### FAM-02

Invitation must specify one of:

- Admin
- Organizer
- Manager

### FAM-03

Invited members must create or log into an account before accessing the wedding workspace.

### FAM-04

Bride, Groom, and Admin must be able to view current family members.

### FAM-05

Bride and Groom must be able to change family-member roles.

### FAM-06

Admins may manage Organizers and Managers.

### FAM-07

Family members may be removed from the wedding workspace.

### FAM-08

Removing a family member must not delete tasks or records previously associated with them.

---

# 10. Multi-Event Wedding Management

Every wedding can contain multiple events.

Examples include:

- Engagement
- Mehendi
- Haldi
- Sangeet
- Wedding Ceremony
- Reception
- Cocktail Party
- Puja
- Custom ceremonies

### EVT-01

Authorized family members must be able to create events.

### EVT-02

Event information must support:

- Event name
- Event type
- Description
- Date
- Start time
- End time
- Venue name
- Venue address
- Map/location URL
- Cover image
- Notes

### EVT-03

Users must be able to edit and delete events.

### EVT-04

The system must provide common Indian wedding event templates.

### EVT-05

Users must also be able to create custom event types.

### EVT-06

Events must be displayed chronologically.

### EVT-07

Events must support relationships with:

- Guests
- Tasks
- Vendors
- Expenses
- Livestreams

### EVT-08

Deleting an event must require confirmation.

Related records must not be silently deleted.

---

# 11. Wedding Dashboard

The dashboard provides a consolidated overview of wedding preparation.

### DASH-01

Dashboard must display:

- Total events
- Upcoming events
- Days remaining until wedding
- Invited households
- Confirmed households
- Expected attendees
- Pending RSVPs
- Total tasks
- Completed tasks
- Overdue tasks
- Overall wedding budget
- Total recorded expenses
- Remaining budget

### DASH-02

Dashboard should show upcoming deadlines.

### DASH-03

Dashboard should provide event-level summaries.

### DASH-04

Dashboard should highlight items needing attention.

Examples:

- Pending RSVPs
- Overdue tasks
- Budget overspend
- Upcoming event deadlines

---

# 12. Task Management

### TASK-01

Family members must be able to create tasks.

### TASK-02

Tasks must contain:

- Title
- Description
- Assignee
- Due date
- Priority
- Status
- Related event

### TASK-03

Task status values:

- To Do
- In Progress
- Completed

### TASK-04

Priority values:

- Low
- Medium
- High

### TASK-05

Users must be able to edit and delete tasks.

### TASK-06

Users must be able to filter tasks by:

- Event
- Assignee
- Status
- Priority

### TASK-07

Overdue tasks must be visually identifiable.

### TASK-08

Dashboard must display task completion progress.

---

# 13. Budget and Expense Management

V1 provides expense tracking but does not provide accounting or payment-schedule management.

### FIN-01

Users must be able to define an overall wedding budget.

### FIN-02

Users may optionally define event-level budgets.

### FIN-03

Users must be able to create expense records.

### FIN-04

Expense records must support:

- Expense title
- Category
- Description
- Amount
- Date
- Related event
- Related vendor
- Notes

### FIN-05

Expense categories should include common categories such as:

- Venue
- Catering
- Photography
- Decoration
- Clothing
- Jewellery
- Entertainment
- Transportation
- Accommodation
- Invitations
- Gifts
- Miscellaneous

### FIN-06

Users must be able to create custom categories.

### FIN-07

Users must be able to edit and delete expense records.

### FIN-08

All authenticated wedding family members may view expense information.

### FIN-09

System must provide:

- Total budget
- Total expenses
- Remaining budget
- Event-wise spending
- Category-wise spending

### FIN-10

System must highlight when expenses exceed defined budgets.

### Explicit V1 exclusion

The system will not track:

- Payment installments
- Payment schedules
- Payment due dates
- Payment reminders
- Vendor payouts

---

# 14. Vendor Management

V1 contains two related vendor capabilities:

1. Public vendor discovery.
2. Wedding-specific vendor management.

---

# 15. Public Vendor Directory

V1 vendor listings are maintained by the Make My Marriage platform.

Vendors do not require vendor accounts in V1.

### VEND-01

Users must be able to browse public wedding vendors.

### VEND-02

Vendor categories should include:

- Catering/Food
- Photographer
- Videographer
- Decorator
- Wedding Planner
- Venue
- Makeup Artist
- Mehendi Artist
- DJ
- Entertainment
- Florist
- Invitation Designer
- Transport
- Hotel/Accommodation
- Jewellery
- Clothing
- Priest/Pandit
- Other

### VEND-03

Vendor profiles must support:

- Business name
- Category
- Description
- City
- Service locations
- Phone
- Email
- Website
- Indicative pricing
- Portfolio photographs
- Services offered

### VEND-04

Users must be able to search vendors.

### VEND-05

Users must be able to filter by:

- Category
- City/location
- Indicative price range

### VEND-06

Users must be able to shortlist vendors.

### VEND-07

Users must be able to compare shortlisted vendors.

### VEND-08

Comparison should include available information such as:

- Category
- Location
- Indicative pricing
- Services
- Contact information

### VEND-09

Users must be able to add a discovered vendor to their wedding vendor list.

### VEND-10

Platform administrators maintain vendor directory records in V1.

### Explicit exclusions

V1 does not include:

- Vendor registration
- Vendor login
- Vendor dashboards
- Availability booking
- Online deposits
- Marketplace checkout
- Vendor commissions
- Vendor subscriptions

---

# 16. Wedding Vendor List

Couples may maintain vendors even if the vendor does not exist in the public directory.

### WVEND-01

Users must be able to manually add vendors.

### WVEND-02

Wedding vendor records should support:

- Vendor name
- Vendor category
- Contact person
- Phone
- Email
- Address
- Website
- Agreed or estimated cost
- Notes

### WVEND-03

A vendor may be associated with one or multiple wedding events.

### WVEND-04

Vendor records may be linked with expense records.

### WVEND-05

Users must be able to edit and remove wedding vendors.

---

# 17. Guest Household Management

Make My Marriage V1 uses **household-level guest management**.

Only one representative needs to be entered for each invited family.

### GST-01

Family members must be able to create guest households.

### GST-02

Guest household records must support:

- Family/household name
- Representative name
- Representative email
- Optional phone number
- Notes

### GST-03

Individual accompanying family members do not need separate guest records.

### GST-04

A household can be invited to one or more wedding events.

### GST-05

Users must be able to edit and remove guest households.

### GST-06

Guest households must be searchable.

### GST-07

Guest lists must be filterable by event and RSVP status.

### GST-08

System should support bulk import of guest households.

Preferred V1 format:

- CSV

### GST-09

Guest lists should be exportable.

---

# 18. Digital Invitation System

### INV-01

Users must be able to send invitations through email.

### INV-02

Invitations must be sent to the household representative.

### INV-03

Each invited household receives a unique invitation link.

### INV-04

Guest must not be required to create an account.

### INV-05

Invitation page should display:

- Couple names
- Wedding identity/theme
- Invited events
- Event dates
- Event times
- Venue information
- RSVP interface

### INV-06

Invitation must only display events to which that household has been invited.

### INV-07

Users must be able to view invitation status.

Possible status values:

- Not Sent
- Sent
- Responded

---

# 19. RSVP System

RSVP responses are event-specific.

### RSVP-01

Household representatives may RSVP without logging in.

### RSVP-02

For every invited event, guests choose:

- Accept
- Decline

### RSVP-03

If accepted, the representative must enter:

**Total number attending**

The count includes the representative.

### RSVP-04

No individual guest names are required.

### RSVP-05

Additional accompanying family members do not require organizer approval.

### RSVP-06

Guests must be able to update previously submitted responses using their invitation link.

### RSVP-07

System must track:

- Accepted households
- Declined households
- Pending households
- Expected attendee total

### RSVP-08

Expected attendance must be calculated separately for every event.

---

# 20. Email Communication

Email is the only automated communication channel in V1.

### EMAIL-01

System must send family-member workspace invitations.

### EMAIL-02

System must send guest wedding invitations.

### EMAIL-03

Authorized users must be able to manually send RSVP reminder emails to pending households.

### EMAIL-04

Authorized users must be able to manually send event reminder emails.

### EMAIL-05

System should record basic email state where available:

- Requested
- Sent
- Failed

### V1 exclusion

No:

- WhatsApp automation
- SMS
- automated marketing
- recurring reminder campaigns

Automatic scheduled reminders may be considered after V1.

---

# 21. Wedding Website

Each wedding may have a guest-facing wedding website.

### WEB-01

Family members must be able to enable or disable the wedding website.

### WEB-02

Website must have a unique shareable URL.

### WEB-03

Wedding website home page should display:

- Couple names
- Cover photograph
- Wedding title
- Short introduction
- Primary dates

### WEB-04

Website must contain an Events section.

### WEB-05

Events section should display:

- Event name
- Date
- Time
- Venue
- Address
- Location link
- Description

### WEB-06

Events should appear chronologically.

### WEB-07

Wedding website must be responsive.

### WEB-08

Couples must be able to select from 2–3 predefined themes.

Initial theme directions:

**Traditional**  
Indian-inspired decorative visual treatment.

**Minimal**  
Clean modern wedding design.

**Royal**  
Premium ceremonial visual treatment.

### WEB-09

Theme changes must not alter underlying wedding information.

### WEB-10

The website may include YouTube livestream sections when configured.

---

# 22. QR Photo Upload

Photo contribution must not require user registration.

### PHOTO-01

System must generate a wedding-specific photo upload URL.

### PHOTO-02

System must generate a QR code pointing to the upload URL.

### PHOTO-03

Anyone with the upload link may upload photographs.

### PHOTO-04

Upload page must work well on mobile devices.

### PHOTO-05

Users must be able to upload multiple photographs.

### PHOTO-06

Uploaded photographs must initially receive:

**Pending Approval**

status.

### PHOTO-07

Pending photographs must not appear in the gallery.

### PHOTO-08

Bride, Groom, and Admin may:

- Approve photographs
- Reject photographs
- Delete photographs

### PHOTO-09

Approved photographs become visible in the private gallery.

### PHOTO-10

System must validate supported file types.

Suggested:

- JPG/JPEG
- PNG
- WEBP

### PHOTO-11

System must enforce configurable upload-size limits.

### PHOTO-12

System must include basic protection against excessive uploads or abuse.

---

# 23. Private Wedding Gallery

### GAL-01

Wedding gallery must have a unique viewing URL.

### GAL-02

Gallery URL must be separate from the upload URL.

### GAL-03

No account is required to view the gallery.

### GAL-04

Only approved photographs may appear.

### GAL-05

Gallery must be mobile responsive.

### GAL-06

Authorized family members must be able to remove photographs.

### GAL-07

Gallery should support chronological or newest-first display.

### Security limitation

The V1 gallery is **link-private**, not identity-private.

Anyone possessing the link may potentially access the gallery.

This must be communicated clearly to wedding administrators.

---

# 24. YouTube Livestream Integration

### LIVE-01

Authorized users must be able to associate a YouTube livestream URL with an event.

### LIVE-02

Livestream must be embedded into the wedding website.

### LIVE-03

Livestream should display under the corresponding event.

### LIVE-04

Users must be able to update or remove the link.

### LIVE-05

Make My Marriage will not host, transcode, or distribute video streams.

YouTube remains responsible for video streaming.

---

# 25. Search, Filtering and Navigation

Operational screens should provide practical filtering where appropriate.

The application should support:

- Event filtering
- Guest filtering
- Task filtering
- Expense filtering
- Vendor filtering
- RSVP filtering

Global navigation should provide quick access to:

- Dashboard
- Events
- Guests
- Tasks
- Expenses
- Vendors
- Website
- Invitations
- Gallery
- Family Members
- Settings

---

# 26. Confirmation and Destructive Actions

Because V1 does not include an audit log, destructive actions require stronger safeguards.

Confirmation must be required before:

- Deleting an event
- Deleting a guest household
- Deleting an expense
- Removing a family member
- Removing a vendor
- Deleting uploaded photographs

Where technically practical, soft deletion should be preferred over immediate irreversible deletion.

---

# 27. Non-Functional Requirements

## Responsive Design

Application must support:

- Desktop
- Tablet
- Mobile web

Guest-facing pages should be designed mobile-first.

## Performance

Normal application pages should load quickly under expected consumer internet conditions.

The application should use pagination or incremental loading for:

- Large guest lists
- Vendor listings
- Photo galleries

## Scalability

Architecture must support weddings ranging from small family events to large weddings with hundreds or thousands of invitees.

The database must not assume fixed limits for:

- Events
- Guests
- Tasks
- Vendors
- Expenses

Reasonable application limits may later be introduced for operational control.

## Security

The system must protect:

- User credentials
- Guest email addresses
- Wedding financial information
- Private photographs
- Invitation links
- Gallery links

Every wedding workspace must remain isolated from other weddings.

## Privacy

Only information needed for wedding coordination should be collected.

Guests must not be required to create accounts.

Guest contact information must not be exposed publicly.

## Reliability

Core wedding information should remain available during critical wedding periods.

## Accessibility

Forms, navigation, controls, and guest-facing experiences should follow reasonable web accessibility practices.

---

# 28. Data Domains

The primary V1 business entities are expected to include:

| Domain | Examples |
|---|---|
| User | Bride, Groom, Admin, Organizer, Manager |
| Wedding | Main wedding workspace |
| Wedding Member | User membership and role |
| Event | Haldi, Wedding, Reception |
| Task | Assigned wedding work |
| Budget | Overall/event allocation |
| Expense | Recorded cost |
| Guest Household | Invited family |
| Event Invitation | Household-to-event invitation |
| RSVP | Attendance response and count |
| Vendor | Public vendor directory entry |
| Wedding Vendor | Vendor selected/added by family |
| Email | Invitation/reminder delivery |
| Website | Wedding-site configuration |
| Theme | Predefined visual theme |
| Photo | Guest-uploaded media |
| Gallery | Approved wedding media |
| Livestream | YouTube event stream |

This section defines product entities only. It is **not yet the database schema**.

---

# 29. V1 Explicit Exclusions

The following must not be added to V1 without scope approval:

- Guest accounts
- Individual guest profiles
- Family-member approval for accompanying guests
- SMS
- WhatsApp messaging
- AI wedding assistant
- AI planning recommendations
- Vendor accounts
- Vendor dashboards
- Vendor self-registration
- Online vendor booking
- Online vendor payments
- Payment gateway
- Vendor commissions
- Vendor subscriptions
- Payment schedules
- Installment tracking
- Payment reminders
- Wedding accounting
- Activity logs
- Audit trails
- Native Android application
- Native iOS application
- Custom livestream infrastructure
- Facial recognition
- Public photo gallery
- Automatic RSVP reminder scheduling

---

# 30. V1 Primary User Journey

A typical couple should be able to complete the following journey:

### Stage 1 — Create Wedding

Register → Create Wedding → Add Partner → Configure Wedding Details

### Stage 2 — Build Wedding Structure

Create Events → Add Venues → Add Dates and Schedules

### Stage 3 — Add Family

Invite Admins → Invite Organizers/Managers → Assign Tasks

### Stage 4 — Plan Finances

Set Budget → Add Expenses → Associate Vendors → Monitor Spending

### Stage 5 — Organize Vendors

Browse Vendor Directory → Compare Vendors → Shortlist → Add Chosen Vendors

### Stage 6 — Manage Guests

Add/Import Guest Families → Assign Events → Review Guest Lists

### Stage 7 — Invite Guests

Send Email Invitations → Guests Open Unique Links → Submit RSVPs

### Stage 8 — Monitor Wedding

Dashboard → Attendance → Tasks → Expenses → Upcoming Events

### Stage 9 — Publish Wedding Website

Select Theme → Preview → Publish → Share Website

### Stage 10 — Wedding-Day Experience

Embed YouTube Livestream → Display QR Photo Upload → Guests Upload Photos

### Stage 11 — Memories

Admin Reviews Photos → Approves Photos → Approved Photos Appear in Private Gallery → Share Gallery Link

---

# 31. Success Metrics for V1

Initial success should be measured primarily through product usage rather than revenue.

Potential metrics include:

### Activation

Percentage of registered couples who:

- Create a wedding
- Create at least two events
- Add at least one family member

### Planning Engagement

Percentage who:

- Add tasks
- Add expenses
- Add guests
- Add vendors

### Invitation Usage

- Number of household invitations sent
- Email delivery success
- RSVP completion rate

### Guest Engagement

- RSVP response rate
- Photo uploads
- Gallery usage
- Livestream clicks

### Wedding Website

- Percentage of weddings publishing a website
- Website visits

### Vendor Discovery

- Vendor searches
- Vendor comparisons
- Vendor shortlist additions

### Retention

Because weddings are temporary projects, conventional long-term monthly retention is not the best primary metric.

More useful metrics include:

- Weekly planning activity during the wedding-planning period
- Number of active family collaborators
- Percentage of core modules used before wedding date

---

# 32. V1 Acceptance Definition

V1 should be considered functionally complete when a couple can independently:

1. Register and create a wedding.
2. Add their partner and family collaborators.
3. Create multiple wedding events.
4. Create and assign tasks.
5. Define a budget and record expenses.
6. Browse, compare, and manage vendors.
7. Add or import guest households.
8. Invite households to specific events.
9. Send personalized invitation emails.
10. Receive Accept/Decline responses and attendance counts.
11. View RSVP totals on event and wedding dashboards.
12. Publish a themed wedding website.
13. Add YouTube livestreams.
14. Generate a QR photo-upload link.
15. Moderate guest-uploaded photographs.
16. Share a private approved-photo gallery.

The product should accomplish these tasks without requiring guests to register.

---

# 33. Recommended V1 Internal Delivery Structure

Although all features belong to the final V1 product, implementation should be delivered internally in stages.

### Foundation

Authentication, wedding workspace, membership, roles, events.

### Planning

Tasks, budgets, expenses, wedding dashboard.

### Guests

Guest households, event invitations, RSVP.

### Communication

Email invitation and reminder functionality.

### Vendors

Public vendor directory, filters, comparison, wedding vendor records.

### Wedding Experience

Wedding website and themes.

### Media

QR uploads, moderation, private gallery.

### Livestream

YouTube integration.

This staged approach reduces technical risk while preserving the agreed V1 product scope.

---

# 34. Future Product Directions

These are not V1 commitments.

Potential future versions could introduce:

- WhatsApp invitations
- SMS notifications
- Automated reminders
- Vendor accounts
- Vendor self-service listings
- Verified vendor reviews
- Vendor availability calendars
- Vendor quote requests
- Vendor bookings
- Payment processing
- Vendor subscriptions
- Sponsored listings
- Accommodation management
- Transportation coordination
- Seating plans
- QR guest check-in
- Wedding-day command center
- AI wedding planning assistant
- AI budget recommendations
- AI vendor recommendations
- Native mobile applications

These capabilities should only be prioritized after observing how couples actually use V1.

---

# 35. Product Scope Statement

**Make My Marriage V1 is a free, responsive, India-first collaborative wedding-management application where the bride, groom, and authorized family members can organize multiple wedding events, tasks, budgets, expenses, guest households, invitations, RSVPs, and vendors from a shared workspace. Couples can also create a themed wedding website, embed YouTube livestreams, allow QR-based guest photo uploads with admin moderation, and share approved photographs through a private gallery link. Guests interact without accounts.**

This statement represents the baseline scope for Version 1.