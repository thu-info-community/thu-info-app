# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Undergraduate and graduate students at Tsinghua University, using THUInfo as a daily driver for campus life: checking the class schedule, booking classrooms, library seats and sports facilities, reading dorm and electricity status, topping up the campus card, managing the campus network, and filing administrative requests through the school's online-service portal (THOS). They are on a phone, in short interrupt-driven sessions, often on campus Wi-Fi or the school's WebVPN — look something up, book something, recharge something, then back to whatever they were doing.

Contributions are limited to Tsinghua students, and the app is also installed by staff and alumni, but those are not the design target. The primary job is the current student's daily campus errand.

## Product Purpose

THUInfo integrates Tsinghua University's many separate campus information systems — course schedules, classroom availability, library seating and room booking, dormitory and electricity metrics, campus-card balance and recharge, sports-facility booking, campus-network status, and the THOS administrative-service portal — into a single native application. The official information lives scattered across dozens of sites and portals with inconsistent logins, inconsistent layouts and no good mobile experience.

Success means a student can finish a campus errand inside the app far faster than by opening the corresponding official site, and trusts the app to report the result correctly.

## Positioning

An unofficial, community-maintained client. It is not built or endorsed by the university; it is built by Tsinghua students for Tsinghua students, released under the Business Source License 1.1, and free to use with no ads, no paid tier, and no account on any THUInfo-operated server. Credentials and session state are held on the device and requests are made against the school's own systems. A product that wrapped a single official portal could not truthfully claim this: the value is the union of all of them in one native app, kept current by the students who use it.

## Operating Context

- Sessions are short, mobile and interrupt-driven; many functions depend on the school's authentication (WebVPN roaming / THOS session).
- Login, cookies, WebView, permissions and native bridges behave differently across Android, iOS and HarmonyOS. This is one React Native client shipped to all three.
- Portal-facing data access flows through `@thu-info/lib`; the app layer owns UI, navigation, Redux state and platform integration.
- Some functions move real money (campus-card and electricity recharge) and carry explicit written commitments for uncredited payments.
- Feature-of-record documentation lives under `docs/` (for example `docs/online-services.md`).
- The interface is bilingual (Simplified Chinese and English) with light and dark theming.

## Capabilities and Constraints

Confirmed surfaces under `src/ui/`: home (campus card, dorm, electricity, library, classroom, network, sports, THOS online services, finance and payments), schedule, news, and settings (login, ID login logs, two-factor auth, app secret / app lock, dark mode, language, about, feedback).

Constraints established by the repository:

- Never bypass `@thu-info/lib` to patch over a portal problem inside the app.
- Do not assume Android, iOS and HarmonyOS behave identically around permissions, cookies, WebView or native bridges.
- Data comes from undocumented university endpoints; missing, malformed or non-mandatory-field responses are errors, not empty states.

Undecided facts: none recorded during init.

## Brand Commitments

- Name: THUInfo (application id `com.unidy2002.thuinfo`).
- The violet/purple identity is a recognizable asset and must be preserved (for example light-mode primary `#671E7F`, dark-mode primary `#7A2694`, and the purple accent family).
- Voice: practical, plain, student-to-student, in both Chinese and English.
- Unofficial and non-commercial: no ads, no paid tier, no THUInfo-operated account server; source released under Business Source License 1.1.
- The written commitment language around recharge failures (contact i@thuinfo.net within an hour; compensation for uncredited amounts) is factual and must not be softened or dropped.
- Support channels: in-app feedback, i@thuinfo.net, GitHub Discussions.

## Evidence on Hand

- Shipped, in-production builds on the App Store, Huawei AppGallery, and first-party APK downloads at `app.cs.tsinghua.edu.cn` — this is live software, not a prototype.
- `docs/online-services.md`: a detailed design-and-verification record for the THOS feature naming real endpoints, data-lifecycle rules and explicitly unverified areas.
- Synthetic fixtures and an `8888` demo account backing the automated UI tests under `test/`.
- Real UI copy in the bilingual translation tables (`src/assets/translations/{en,zh}.ts`).
- No marketing testimonials, press coverage or case studies exist; future work must not fabricate any.

## Product Principles

1. Unofficial and honest — this is a community client, and it never overstates what it can promise.
2. Aggregate, don't fragment — every new capability should reduce the number of places a student must visit, not add another silo.
3. Correctness over optimism — an unknown campus state is shown as unknown, and a failure reads as a failure, never as an empty success.
4. Portable by default — Android, iOS and HarmonyOS are all first-class; a design or behavior that works on only one platform is incomplete.
5. Device-held trust — credentials and session state live on the student's device, and THUInfo operates no account server.

## Accessibility & Inclusion

Bilingual Simplified Chinese and English is a confirmed product requirement. No formal accessibility standard has been established; large-text scaling, screen-reader support and reduced-motion behavior are possible gaps rather than documented commitments.
