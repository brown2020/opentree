# Competitor Analysis: Ancestry.com

## 1. Core Value Prop

Ancestry.com solves the problem of **discovering, documenting, and preserving family history**. It combines three things that are individually hard to do: (1) building a family tree with relationships, dates, and places, (2) finding historical records that confirm or extend what you know, and (3) connecting with living relatives who share common ancestors.

People use it because:
- They want to know where they came from
- They want to preserve family stories before they're lost
- DNA testing satisfies curiosity about ethnic heritage
- The record database makes discoveries feel magical ("hints" that find your ancestors for you)
- It's the market leader with the largest user base, which means the most shared trees and DNA matches

## 2. Feature Breakdown

### Free Tier (account required, no subscription)
- **Family tree builder** — visual pedigree/fan chart, add people with names, dates, places, relationships. Unlimited trees, unlimited people per tree
- **Basic search** — limited access to some records
- **GEDCOM import/export** — upload from other software, download your tree data
- **3 DNA traits** — if you buy a DNA kit
- **Photo uploads** — attach photos to people in your tree
- **Sharing** — invite family members to view or edit your tree
- **Privacy controls** — public or private trees, living people auto-hidden

### Paid: U.S. Discovery ($25/mo or $99/6mo)
- **Full U.S. record access** — census, birth/marriage/death, immigration, military, etc.
- **Ancestry Hints** — green leaf icons that suggest matching records based on tree data
- **Record previews** — view transcribed record data, attach records to people
- **Search filters** — narrow by date, location, record type, etc.

### Paid: World Explorer ($40/mo or $149/6mo)
- Everything in U.S. Discovery
- **International records** — UK, Ireland, Europe, Canada, Mexico, Australia, and 80+ countries
- **100M+ public trees** — search other members' trees for common ancestors

### Paid: All Access ($60/mo or $199/6mo)
- Everything in World Explorer
- **Newspapers.com** — historical newspaper archive
- **Fold3** — military records archive

### Add-ons
- **AncestryDNA kit** ($99, often on sale for $59) — saliva test, ethnicity breakdown, DNA matches, ancestral journeys
- **AncestryDNA Plus** ($5/mo) — 75+ traits, ThruLines, chromosome painter, inheritance tracking
- **Pro Tools** ($10/mo) — tree checker (find errors/duplicates), tree mapper (geographic visualization), charts & reports, smart filters, clustering
- **Preserve My Tree** ($5/mo) — archival backup

### Platform Features
- **StoryMaker** — create narrative stories with photos, records, and audio
- **Photo gallery** — upload, organize, and share photos; AI-powered face recognition
- **Timelines** — visualize a person's life events chronologically
- **Mobile apps** — iOS and Android with photo scanning capabilities
- **Search** — powerful search across billions of records with filters
- **Notifications** — alerts when new hints appear or family members contribute

## 3. UX Strengths (what they get right)

### The "Hint" system is addictive
The green leaf icon that appears when Ancestry finds a potential record match is the single most compelling feature. It turns genealogy research from tedious manual searching into a dopamine-driven discovery loop: see leaf → click → review record → add to tree → get more leaves. This is the feature that keeps people subscribed.

### Progressive disclosure of complexity
New users start by entering parents and grandparents — simple forms with name, date, place. The tree visualization grows as they add people. Advanced features (search filters, DNA analysis, source citations) appear gradually as users go deeper.

### Tree visualization is clear
The pedigree view (horizontal tree growing left to right, with the home person on the left) is intuitive. You can switch between pedigree, family, fan chart views. Clicking a person shows a sidebar with their details, relationships, and attached records.

### Record attachment creates trust
When you attach a census record or birth certificate to a person, it shows as a "source." This source-based approach gives the tree credibility and teaches users good genealogy practice.

### Collaboration works smoothly
Inviting family members to contribute is straightforward. Multiple people can work on the same tree. There's a clear activity feed showing recent changes.

### Mobile photo scanning
The mobile app can scan physical photos and automatically crop/enhance them. This solves a real problem — digitizing shoeboxes of old family photos.

## 4. UX Weaknesses (what they get wrong)

### Aggressive monetization ruins trust
Users constantly hit paywalls. You can see that a hint exists but can't view the record without paying. DNA features are split across multiple paid tiers. This creates frustration and a feeling of being nickel-and-dimed. Consumer reviews are scathing about this.

### Navigation is confusing
Users report getting lost, especially when clicking back from a record view. The UI has accumulated years of features and the information architecture suffers. Multiple users describe it as a "navigation nightmare."

### Subscription lock-in
When you cancel, you lose access to records you've attached to your tree (you keep the tree, but record images and transcriptions are locked). This feels punitive and is the #1 complaint on review sites.

### Auto-renewal billing
Aggressive auto-renewal practices with difficult cancellation have generated thousands of BBB complaints and class-action lawsuit attention.

### Data quality in shared trees
Because anyone can create and share a tree, there are millions of inaccurate shared trees with bad dates, wrong relationships, and copy-paste errors. Hints from shared trees can mislead users into adding wrong information.

### Overwhelming for beginners
Despite progressive disclosure, new users can still feel overwhelmed by the sheer volume of features, record types, and options. The onboarding could be simpler.

### No real offline capability
Web-first with limited offline support. Users who travel to archives or family reunions can't easily work offline.

### GEDCOM export is lossy
Photos and documents don't export with GEDCOM. You can lose significant work if you leave the platform.

## 5. Table Stakes (must-have to compete)

Any family tree app that wants to be taken seriously needs:

1. **Family tree builder** — add people, define relationships (parent/child, spouse, sibling), store dates and places
2. **Tree visualization** — visual pedigree/ancestor chart showing relationships at a glance
3. **Person profiles** — detailed view per person with bio, dates, places, photos, documents
4. **Photo and document management** — upload, organize, and attach media to people
5. **Timeline/life events** — chronological view of a person's life events
6. **GEDCOM import/export** — standard data portability format for genealogy
7. **Sharing and collaboration** — invite family members to view and contribute
8. **Privacy controls** — control what's public, auto-hide living people's details
9. **Search within your tree** — find people by name, date, place
10. **Relationship calculator** — show how two people in the tree are related
11. **Mobile-friendly** — responsive design, works well on phones/tablets
12. **Data export** — users must be able to take their data with them

## 6. Differentiators (where we can win)

### Free and open source
Ancestry charges $25-60/month. We charge nothing. No paywalls, no locked features, no subscription traps. This alone is a massive differentiator. Open source means users can self-host, audit the code, and contribute.

### No data hostage
Full data portability. GEDCOM export includes everything. Your data is yours, always. This directly exploits Ancestry's biggest weakness.

### Privacy-first
No selling data, no AI training on family photos, no third-party analytics. Users own their data. Ancestry's privacy practices are a recurring concern.

### Modern tech, modern UX
Ancestry's UI is 15+ years of accumulated cruft. We can build a clean, fast, modern interface from scratch. No legacy baggage.

### Smart relationship features
Ancestry's relationship handling is basic — you manually define every connection. We can build smarter relationship inference: if A is parent of B and parent of C, then B and C are siblings. If A married B, show B as step-parent to A's children. Relationship calculator showing "2nd cousin once removed" etc.

### Collaboration-first
Ancestry treats collaboration as a feature bolted onto a single-user product. We can design for collaboration from day one — real-time updates, granular permissions (viewer/editor/admin), activity feeds, comments on people and events.

### AI-powered assistance (future)
Smart suggestions based on entered data: "You entered a birth in 1920 in New York — did you know the 1920 census was taken in January? Here are search tips." Date validation, name variant suggestions, place name normalization.

### Beautiful, printable outputs
Family tree charts, pedigree charts, and family group sheets that look good enough to frame. Ancestry's print options are mediocre. Beautiful PDF/SVG export of trees and reports could be a differentiator.
