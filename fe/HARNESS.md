# Figma Harness

This frontend includes harness rules for Figma-driven implementation, design review, and smoke checks.

## Core Rule

For any page driven by Figma, do not start by editing code.
Lock the harness first, then compare Figma values against local values, then implement only the confirmed diff.

Absolute lock:

- Figma is read-only for implementation work in this repo.
- Do not create, move, delete, rename, restore, or otherwise modify Figma nodes for local implementation tasks.
- Do not use any Figma write-path workflow unless the user explicitly asks for Figma editing work.
- Local implementation means: read from Figma, implement in code, verify locally.

Required order:

1. Fix the target Figma file and node id
2. Read structure with `get_metadata`
3. Read exact values for key blocks with `get_design_context`
4. Record the page harness spec before editing code
5. Record the variant matrix before editing code
6. Record the interaction and data contract before editing code
7. Extract current local values from the target page and any shared components
8. Produce a Figma vs local diff
9. Edit only the diff
10. Verify with the harness screenshot flow

Interpretation rule:

- If a value is not present in the harness spec, do not invent it.
- If a shared component prevents exact matching, split the page into a page-specific implementation.
- If live API data changes text length or card height, treat the design harness as the visual source of truth and clamp the runtime output to the harness where needed.
- If the target node contains a behavior or variant dimension not yet documented, stop and extend the harness before editing code.

## Figma Intake Contract

Every Figma-driven page must start with a written intake contract.

Required intake fields:

- route
- figma file key
- figma node id
- exact review viewport
- read-only confirmation
- target route mode: `review-only` | `real route`
- data mode: `fixture` | `mocked api` | `live api`
- implementation scope: `page-specific` | `shared component reuse`
- review node list
- variant node list
- interaction node list

Interpretation rule:

- A single node link is not enough when the page includes multiple component variants.
- If cards, tabs, FAB, bottom nav, overlays, or scroll rows exist, record the exact node ids for each reviewed state.

## Variant Matrix

Before editing code, record a variant matrix for all repeated or interactive blocks.

Required columns:

- block name
- figma node id
- variant name
- visible rows
- hidden rows
- reserved space behavior
- image state
- text state
- CTA state
- scroll state
- notes

Minimum targets:

- regular vs compact card
- image vs no-image card
- CTA visible vs CTA hidden
- selected vs unselected tab
- FAB collapsed vs FAB expanded
- bottom nav selected vs inactive
- default vs empty vs loading list state

Interpretation rule:

- Do not infer variant rules from semantics such as success, failure, or popularity.
- Visibility and structure must be locked from node evidence.

## Interaction And Data Contract

Before implementation, declare which parts are purely visual and which are functional.

Required fields:

- section or component name
- visual source node id
- interaction type
- expected click target
- navigation target
- API dependency
- auth dependency
- optimistic update rule
- loading rule
- error rule
- fallback display rule

Common targets:

- card surface click
- CTA click
- bookmark click
- heart or reaction click
- segmented control change
- horizontal card scroll
- FAB toggle
- bottom nav route change

Interpretation rule:

- Figma parity is incomplete if click targets, disabled behavior, or scroll behavior are missing.
- Function wiring must be documented before live API attachment.

## Page Harness Spec

Every Figma implementation should have a page-level harness spec before work starts.

Minimum spec:

- route
- figma file key
- figma node id
- target viewport
- fixed runtime rules
- section list
- per-section spacing
- per-section layout model
- per-section box model
- per-section position model
- per-section overflow and clipping
- per-section visibility rules
- per-section typography
- per-section text behavior
- per-section asset behavior
- per-section state behavior
- per-section effects
- per-section colors, radius, border, shadow
- components allowed to stay shared
- components that must be page-specific
- review scenarios
- review priority
- exception log
- variant matrix
- interaction and data contract
- fixture content contract
- icon asset contract
- rendered-box checkpoints

Recommended template:

```md
## [Page Name]

- route: `/target-route`
- figma file: `FILE_KEY`
- figma node: `1234:5678`
- viewport: `375x812`
- data mode: `mocked` | `live`

### Sections

- Header
  - layout: display, direction, align, justify
  - box model: box-sizing, padding, margin, border
  - position: static, relative, absolute, fixed, sticky
  - overflow: hidden, visible, clipping behavior
  - visibility: opacity, display, visibility
  - frame: `x/y/width/height`
  - logo: font, size, weight, line-height, color
  - actions: size, gap, padding
- Search
  - layout: display, align, justify
  - box model: box-sizing, padding, margin, border, radius
  - position: static, relative, absolute, fixed, sticky
  - overflow: hidden, visible, clipping behavior
  - visibility: opacity, display, visibility
  - container: width, height, padding, border, radius
  - placeholder: font, size, weight, line-height, color
- Card
  - layout: display, direction, align, justify
  - box model: box-sizing, padding, margin, border, radius
  - position: static, relative, absolute, fixed, sticky
  - overflow: hidden, visible, clipping behavior
  - visibility: opacity, display, visibility
  - outer: width, min-height, border, radius, shadow
  - inner: padding, gap
  - title: font, size, weight, line-height
  - body: font, size, weight, line-height
  - meta: font, size, weight, line-height, gap
  - cta: height, padding, radius, font

### Text Rules

- wrapping: explicit rule per text block
- ellipsis: explicit rule per text block
- line clamp: explicit rule per text block
- letter-spacing: exact match
- font-feature-settings: exact match
- number formatting: exact match
- date formatting: exact match

### Asset Rules

- image crop: exact match
- object-fit: exact match
- object-position: exact match
- placeholder usage: exact match
- asset resolution: exact match where fixed
- compression behavior: document when relevant

### State Rules

- default
- hover
- active
- focus
- disabled
- selected
- empty
- loading
- error

### Effects Rules

- shadow full value
- blur
- background gradient
- divider color
- divider thickness

### Review Priority

1. structure
2. spacing
3. typography
4. asset and icon
5. interaction and state

### Exception Log

- mismatch summary
- reason
- technical constraint or intentional runtime difference
- user approval status

### Shared Component Policy

- allowed shared: `ComponentA`, `ComponentB`
- forbidden shared: `ComponentC`

### Review Scenarios

- default
- expanded
- empty
- loading
- long-data
```

## Fixture Content Contract

Exact visual review requires exact fixture content, not approximate copy.

Required fixture rules:

- title text must match the review node
- preview text must match the review node
- date format must match the review node
- count format must match the review node
- tag labels must match the review node
- explicit literal `...` is forbidden when Figma expects CSS ellipsis
- line-breaks must come from CSS behavior, not hardcoded guessed splitting

Interpretation rule:

- If fixture text differs, screenshot review is non-authoritative even when spacing looks correct.

## Icon Asset Contract

Every Figma task must declare icon intake before code edits.

Required fields:

- figma node id
- local asset path
- export source: `existing local` | `figma export` | `code connect`
- frame size
- glyph size
- stroke width
- fill mode
- viewBox
- optical center notes

Interpretation rule:

- Importing the right icon family is not enough if the glyph box differs from Figma.

## Rendered-Box Checkpoints

For every major section, define which boxes must be measured in the browser before screenshot review.

Recommended targets:

- page frame
- section outer frame
- section inner content width
- repeated item width and height
- text column width
- media slot width and height
- meta row width and height
- CTA row width and height
- overlay anchor box
- fixed bottom area height

Interpretation rule:

- Code-value parity alone is insufficient.
- Screenshot parity alone is insufficient.
- The measured browser box is the required middle checkpoint.

## Figma Workflow Lock

This is the default workflow for all future Figma tasks in this repo.

- First response: identify route, file key, node id, and whether data is mocked or live
- Before edits: produce the harness spec, variant matrix, interaction contract, and value diff
- During edits: keep values tied to the harness spec, not memory or approximation
- After edits: capture screenshots and review only against the fixed harness target

## Tolerance Rules

Unless a page harness explicitly says otherwise, use zero-tolerance matching for Figma implementation review.

- display: exact match
- flex/grid direction: exact match
- align-items / justify-content: exact match
- position: exact match
- gap: exact match
- padding: exact match
- margin: exact match
- box-sizing interpretation: exact match
- overflow: exact match
- clipping behavior: exact match
- opacity: exact match
- display visibility state: exact match
- visibility state: exact match
- border presence: exact match
- border width: exact match
- border color: exact match
- border style: exact match
- spacing: exact match
- font size: exact match
- font weight: exact match
- line-height: exact match
- color: exact match
- border radius: exact match
- border width: exact match
- shadow: exact match
- blur: exact match
- gradient: exact match
- divider color: exact match
- divider thickness: exact match
- letter-spacing: exact match
- font-feature-settings: exact match
- line clamp: exact match
- ellipsis behavior: exact match
- number/date formatting: exact match
- object-fit / object-position: exact match
- placeholder behavior: exact match
- icon stroke width: exact match
- icon fill behavior: exact match
- icon viewBox ratio: exact match
- icon optical size: exact match
- width and height: exact match for fixed elements

Interpretation rule:

- Do not accept “close enough” for visual review routes.
- If runtime content forces a difference, document that exception in the page harness spec before implementation.

## Data Policy

Every page harness must declare which data mode is used for visual review.

Allowed modes:

- `mocked`: use deterministic review data for exact Figma comparison
- `live`: use real API data, but clamp runtime presentation to the harness rules

When `live` is used, define:

- title line clamp
- body line clamp
- placeholder behavior for missing images
- fallback labels for missing category or keyword values
- empty state and loading state expectations

Interpretation rule:

- Live data may change content, but it must not change the harness structure.
- If live data makes exact comparison unstable, add a mocked review route or mocked harness scenario.

## API Attachment Order

To prevent visual drift while implementing Figma pages, attach data in this order:

1. fixture review route with exact Figma copy
2. local structural parity against Figma
3. mocked API with controlled lengths and states
4. live API with clamping rules already fixed
5. interactive API mutations after visual parity is stable

Interpretation rule:

- Do not start with live API data on a page that has not reached fixture parity.
- Bookmark, reaction, category, and list APIs should be attached after the card or list geometry is already locked.

## Shared Component Gate

Shared components are allowed only when they preserve the page harness values exactly.

A shared component must be rejected for a Figma task when any of these differ from the harness:

- display model
- flex/grid settings
- align-items / justify-content
- position model
- padding
- margin
- gap
- box-sizing behavior
- overflow behavior
- clipping behavior
- opacity or visibility behavior
- font family
- font size
- font weight
- line-height
- letter-spacing
- font-feature-settings
- line clamp or ellipsis behavior
- color
- radius
- border
- border width
- border color
- border style
- shadow
- blur
- gradient or divider rendering
- CTA sizing
- badge sizing
- image crop behavior
- object-fit or object-position
- icon sizing or stroke appearance
- icon fill behavior
- icon viewBox ratio
- icon optical size
- state behavior

Interpretation rule:

- If any blocked mismatch exists, create or keep a page-specific implementation for that block.
- Do not bend the page harness to fit an existing shared component.

## Comparison Checklist

Before closing a Figma-driven task, review these areas against the page harness:

- code values taken from Figma Dev Mode
- actual rendered box sizes measured in the browser
- actual clickable hit areas measured in the browser when interactive
- screenshot-level optical alignment after value and box checks pass
- viewport and outer frame
- header structure and spacing
- display, flex/grid, and alignment model
- position model
- box-sizing, padding, margin, and border values
- overflow, clipping, and scroll behavior
- horizontal scroll reach, snap, and hidden-scrollbar treatment
- opacity and visibility behavior
- typography by section
- letter-spacing, font-feature-settings, and formatting behavior
- tabs and segmented controls
- cards and repeated list items
- badges, chips, and labels
- buttons and CTA states
- pointer-events, nested click behavior, and event ownership
- icon source, size, stroke, fill, viewBox, and visual weight
- asset crop, object-fit, object-position, and placeholder behavior
- shadows, blur, gradients, borders, radius, and divider values
- section spacing and list gaps
- bottom navigation or fixed actions
- default, hover, active, focus, disabled, selected states
- loading state
- empty state
- error state
- long-data state

Interpretation rule:

- Review order is fixed:
  1. Figma code values vs local code values
  2. Figma frame or auto-layout size vs actual browser rendered box
  3. actual interaction and scroll box review
  4. optical screenshot comparison
- Do not jump to screenshot-only tuning before value diff and rendered-box diff are both recorded.

## Text Integrity Rules

Text verification must include encoding and font loading integrity.

Required checks:

- UTF-8 text content is not mojibake in source or runtime
- webfont family is loaded before capture
- fallback font is not used during review capture
- locale-sensitive separators match the harness
- date separators match the harness
- mixed-language glyph widths do not come from fallback fonts

Interpretation rule:

- If text is broken because of encoding or fallback fonts, spacing review is invalid until fixed.

## Icon Policy

Icons must be sourced from the Figma design first.

Allowed priority:

1. Figma-connected code component from Code Connect
2. Existing local asset already matched to the same Figma icon
3. Figma-exported asset or Figma screenshot-derived asset reference
4. Existing local icon component only if its size, stroke, fill, and visual weight exactly match the Figma icon

Forbidden behavior:

- choosing a similar icon by guess
- swapping icon families for convenience
- changing stroke width or size without a Figma basis
- changing fill behavior without a Figma basis
- changing viewBox ratio without a Figma basis
- changing optical size without a Figma basis
- replacing a Figma asset with a generic library icon unless exact visual parity is confirmed

Implementation rule:

- For any icon used in a Figma task, record the source in the page harness or change notes:
  - Figma node id
  - local asset path or component name
  - any required size, stroke width, fill mode, and viewBox setting
  - frame size and actual glyph size separately
  - optical centering rule if the glyph is not visually centered by default

Interpretation rule:

- Icon parity is checked in two layers:
  - frame box: the outer icon container used by layout
  - glyph box: the actual visible vector inside that frame
- Matching only the outer `w/h` is insufficient when the visible glyph weight or centering differs from Figma.

## Position Rules

Positioning must match Figma exactly.

- `static`: exact match
- `relative`: exact match
- `absolute`: exact match
- `fixed`: exact match
- `sticky`: exact match

Priority targets:

- FAB
- bottom navigation
- badges
- overlays
- floating buttons

Overlay rules:

- record whether the block stays in normal flow or overlaps the previous block
- record the exact overlap amount in px
- record stacking context and z-index when relevant
- record whether the overlay anchor is the page, section, or component root

Interpretation rule:

- FAB area, bottom nav area, floating CTA rows, and popovers must not be reviewed as ordinary stacked blocks if Figma uses overlap composition.

## Overflow And Clipping Rules

Overflow behavior must be explicitly documented and matched.

- `overflow-hidden`: exact match
- `overflow-visible`: exact match
- `overflow-scroll`: exact match
- `text-ellipsis`: exact match
- `line-clamp`: exact match
- clipping boundaries: exact match

Interpretation rule:

- If text leaks, wraps differently, or scroll behavior differs, treat it as a harness mismatch.

## Scroll And Gesture Rules

Scrollable blocks must be declared explicitly.

Required fields:

- scroll axis
- visible viewport width or height
- content width or height
- snap type
- snap alignment per item
- scrollbar visibility treatment
- drag or swipe expectation
- wheel or trackpad expectation

Priority targets:

- popular card row
- chip rows
- carousels
- bottom sheets
- long tab lists

Interpretation rule:

- A row that matches width visually but does not actually scroll is a harness failure.
- A scrollable row must be reviewed by both code values and runtime behavior.

## Opacity And Visibility Rules

Visibility behavior must be explicit for each relevant state.

- `opacity`: exact match
- `display: none`: exact match
- `visibility: hidden`: exact match
- disabled visibility treatment: exact match
- selected visibility treatment: exact match
- skeleton visibility treatment: exact match

Visibility source rule:

- visibility must be recorded by Figma variant or node id, not inferred from badge text, color, or semantic guess
- if one variant hides an element and another shows it, list both explicitly in the page harness

Interpretation rule:

- Do not derive CTA, badge, or meta visibility from domain meaning such as "success" or "failure" unless the Figma component variants explicitly prove that rule.

## State Rules

Every interactive block should declare and be reviewed in these states when applicable:

- default
- hover
- active
- focus
- disabled
- selected
- empty
- loading
- error

Interpretation rule:

- Missing state review is treated as incomplete harness verification.

## Text Rules

Text rendering must be locked beyond font family alone.

- text container structure: exact match
- direct text vs wrapped text node structure: exact match
- text wrapper display model: exact match
- text wrapper vertical alignment model: exact match
- wrapping rule: exact match
- ellipsis rule: exact match
- line clamp rule: exact match
- number format: exact match
- date format: exact match
- letter-spacing: exact match
- `font-feature-settings`: exact match

Interpretation rule:

- Text review is not complete with font family, size, and weight alone.
- Record whether text is rendered directly in the parent or inside an inner wrapper, because line box math and optical centering can change even when typography tokens match.

## Asset Rules

Visual assets must match the Figma treatment, not only the file.

- image crop: exact match
- `object-fit`: exact match
- `object-position`: exact match
- placeholder usage: exact match
- asset resolution expectation: exact match when fixed
- compression differences: document when visually relevant

## Effect Rules

Effects must be documented and matched as complete values.

- full shadow value: exact match
- blur: exact match
- background gradient: exact match
- divider color: exact match
- divider thickness: exact match

## Review Priority Rules

Use this review order for Figma implementation work:

1. structure
2. spacing
3. typography
4. asset and icon
5. interaction and state

## Exception Log Rules

Any remaining mismatch must be documented.

Required fields:

- mismatch summary
- exact affected node or block
- technical constraint or intentional runtime difference
- why exact parity was not achieved
- whether the user approved the exception

## Goals

- Open individual screens without manually walking the whole flow
- Leave screenshot artifacts for Figma comparison
- Keep one smoke path for basic regression checks
- Prevent repeated discussion about the same spacing or font decisions by fixing them in a harness spec first


## Explore Stats Harness

- `npm run qa:explore-stats:review`
  - Captures the explore statistics section in three states:
    - chart visible
    - explanation modal open
    - insufficient data card
  - Writes screenshots and a JSON report under `%TEMP%/sidepick-harness/explore-stats-review`

## Home Harness

- `npm run qa:home:review`
  - Opens the fixed Figma home harness at `/v1/home`
  - Captures:
    - default state
    - category-expanded state
  - Writes screenshots and a JSON report under `%TEMP%/sidepick-harness/home-review`

## Scripts

- `npm run qa:signup:review`
  - Captures the current signup screens one by one
  - Writes screenshots and a JSON report under `%TEMP%/sidepick-harness/signup-review`
- `npm run qa:signup:smoke`
  - Runs a short flow from email signup through identity, verification, username, and password with mocked verification APIs
  - Writes screenshots and a JSON report under `%TEMP%/sidepick-harness/signup-smoke`

## Screen Selection

Use `SIDEPICK_SIGNUP_SCREEN` to focus a single screen.

Examples:

```powershell
$env:SIDEPICK_SIGNUP_SCREEN='signup1-email'; npm run qa:signup:review
$env:SIDEPICK_SIGNUP_SCREEN='signup7-profile'; npm run qa:signup:review
```

Available values:

- `signup1-email`
- `signup2-identity`
- `signup3-identity-details`
- `signup4-verify`
- `signup5-username`
- `signup6-password`
- `signup7-profile`
- `signup8-region`
- `signup9-employment`
- `signup10-purpose`

## Runtime Notes

- Default base URL: `http://127.0.0.1:4173`
- Override with `SIDEPICK_QA_BASE_URL`
- Default browser: Edge at `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
- Override with `SIDEPICK_QA_BROWSER`
- Set `SIDEPICK_QA_HEADLESS=false` for visible browser runs

## Figma Lock Rules

Pixel drift between Figma and implementation usually comes from unstable runtime conditions, not only from bad CSS.
The harness now locks these conditions through [figma-rules.json](/D:/Codex_Folder/Sidepick/fe/scripts/harness/figma-rules.json) and [core.mjs](/D:/Codex_Folder/Sidepick/fe/scripts/harness/core.mjs).

Fixed rules:

- viewport: `375x812`
- `deviceScaleFactor=1`
- locale: `ko-KR`
- timezone: `Asia/Seoul`
- color scheme: `light`
- reduced motion enabled
- CSS animation and transition disabled before capture
- caret hidden before capture
- screenshot only after fonts and images finish loading
- small settle delay before capture

Interpretation rule:

- If Figma and implementation still differ after these locks, treat it as a real implementation mismatch.
- If these locks are not applied, treat minor spacing, line-break, font-width, and timing differences as non-authoritative noise.

Common causes of drift:

- responsive width changed from the Figma frame width
- webfont loaded late and fallback font changed text width
- CSS transition or loading skeleton captured mid-state
- browser DPR or zoom changed
- dynamic API data changed card height or line breaks
- scrollbar or platform rendering changed available width

## Home Harness Rules

- `/v1/home` is now a dedicated Figma review route
- It does not depend on live API responses
- Card copy, counts, category labels, and section composition stay deterministic
- Use this route, not `/`, when comparing the home screen against Figma details

### Home V2 Fixed Values

- route: `/v1/home`
- figma file: `CH6g0anBwKkQRsvm2PWbTs`
- figma node: `2231:11029`
- header frame height: `175`
- status bar height: `59`
- logo and notification row height: `64`
- search row height: `52`
- search field: `343x36`
- search placeholder typography: `Pretendard 14 / 400 / 1.4 / #BABABA`
- category card text region: auto-layout, do not hard-cap with a page-specific max width
- popular topic tab widths: `53 / 53 / 53 / 41`
- popular topic tab row height: `25`
- popular cards row width: `953`
- popular cards x positions: `0 / 321 / 642`
- popular compact card y offset: `19`
- card body text box: `flex: 1 0 0`, do not replace with page-specific fixed widths
- card preview text behavior: single-line overflow with ellipsis
- card media treatment must be variant-locked: placeholder box is not a universal fallback
- meta icon optical size: `Heart 20`, `Bookmark 24`
- CTA alignment: full-width row, right-aligned, button size resolves to `48x30`
- compact card variant height: `149` and does not render the CTA row
- explore segment outer width: `311`
- explore segment x offset inside section: `16`
- explore segment selected tab: `155.5x32`, white fill, `2px #DEDEDE` border, `999` radius, `Pretendard 12 / 500 / #000000`
- explore segment unselected tab: `155.5x40`, `4` radius, `Pretendard 12 / 500 / #5D5D5D`, vertically offset `-4`
- FAB area height: `70`
- FAB position: `x 315 / y 17 / size 36`
- FAB default state: collapsed, green circular button only
- FAB expanded state: white popover above the button, `10px` horizontal padding, `12px` vertical padding, `12px` item gap, `10px` radius, `0 0 4 rgba(0,0,0,0.15)` shadow
- FAB expanded items: `AI 챗봇`, `경험 작성`
- bottom nav label/icon gap: `4`
- bottom nav selected state: icon `24`, label `Pretendard 12 / 600 / #5A876E`, no opacity reduction
- bottom nav inactive state: whole item opacity `0.3`, icon `24`, label `Pretendard 12 / 400 / #000000`

### Home V2 Interaction Rules

### Home V2 Render Lock Addendum

- header total height must be checked both by code value and actual browser rendered box
- logo and notification row must remain `64` by rendered box, not approximate visual spacing
- search row must remain `52` by rendered box, not only by input inner height
- category card text block uses card-width-driven auto-layout, not `max-w` clamping
- card text column must stay flex-based and width-responsive inside the Figma card frame
- card text container structure must be preserved when matching optical text position
- card image presence must be reviewed as a separate variant dimension from status or compactness
- when the node or approved runtime variant has no image, do not keep an empty `80x60` slot unless Figma node evidence explicitly keeps reserved media space
- placeholder media is allowed only for the exact harness fixture or Figma-approved placeholder variant
- meta icon review is split into frame size and glyph size; matching frame size alone is insufficient
- CTA button box model must match Figma exactly: `48x30`, including padding and border-box interpretation
- explore segment visual review must include actual rendered text optical position inside each tab
- footer block follows overlap composition, not simple vertical stacking
- footer block overlap against the previous content region: `54`
- footer review must check actual rendered start y-position as well as total block height
- Home V2 review must reject code that matches values but drifts in actual rendered box size
- Home V2 review must reject code that matches box size but drifts in optical screenshot alignment

### Home V2 Variant Visibility Lock

- visibility rules must stay variant-driven
- do not infer visibility from semantic label text such as success or failure
- if a future Home V2 node differs, add that node id to the harness before editing code
- CTA visibility must be locked from Figma variant or node evidence, not from product meaning
- hidden rows must specify whether they use `display: none`, `visibility: hidden`, or reserved layout space

- popular topic tabs are exact-match visual states only:

- popular topic tabs are exact-match visual states only:
  - selected: `border-bottom 1.5px #5A876E`, `Pretendard 14 / 600 / #5A876E`
  - unselected: no border, `Pretendard 14 / 400 / #BABABA`
- explore segment uses exact selected and unselected geometry; do not normalize both buttons to the same height
- story cards have two approved variants only:
  - regular card: `187` height, CTA visible
  - compact card: `149` height, CTA hidden
- story cards also require media-state locking:
  - fixture / placeholder variant: keeps the `80x60` media box
  - runtime no-image variant: removes the media slot and expands the text column
  - runtime image variant: uses the real image with the same `80x60 / radius 4 / object-cover` treatment
- In the current Home V2 Figma nodes reviewed, CTA visibility follows card variant, not badge tone:
  - `2354:19426` failure regular: CTA visible
  - `2354:19927` failure regular: CTA visible
  - `2354:19469` success compact: CTA hidden
  - `2354:19966` success compact: CTA hidden
- card interaction:
  - card surface click navigates to the detail route
  - CTA, when present, mirrors the card destination and must not diverge
- FAB interaction:
  - first click toggles expanded state
  - second click collapses
  - expanded menu contains exactly two actions from the Figma component
- bottom navigation interaction:
  - selected item is derived from the current route
  - inactive items retain the Figma `0.3` opacity treatment
- review screenshots must include at least:
  - default home state
  - FAB collapsed state
  - explore segment latest selected state

### Home V2 Review Method

- Run this order for every Home V2 diff:
  1. extract Figma code values from the target node
  2. measure current local rendered boxes in browser
  3. write the exact diff in px and typography terms
  4. change only the confirmed diff
  5. run screenshot review after values and boxes match
- Screenshot comparison alone is not sufficient for approval.
- Code-value match alone is not sufficient for approval.
- Both value parity and rendered-box parity are required before optical signoff.

## Delivery Report Format

Every completed Figma task should leave a short implementation report.

Required sections:

- target route and node ids
- implemented scope
- page-specific components created or retained
- shared components rejected and why
- figma vs local diffs fixed
- remaining approved exceptions
- API attachment status
- unreviewed states if any

Interpretation rule:

- Closing a task without a diff summary increases repeat discussion on the next page.

## Explore Stats Notes

- The explore stats harness mocks:
  - `/api/experiences`
  - `/api/stats/failure-pattern`
  - `/api/stats/failure-timing`
- Default scenarios:
  - `categoryId=1` for visible charts
  - `categoryId=5` for insufficient data fallback

## Harness Seed

Signup screens after the first step need intermediate form state. The app now reads an optional seed from local storage key:

- `sidepick.authFlowHarnessSeed`

The review harness writes this key before loading a screen so routes like `/signup/region` or `/signup/purpose` can be opened directly for visual review.
