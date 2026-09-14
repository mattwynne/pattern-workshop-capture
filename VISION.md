# Pattern Workshop Capture — Product Vision

**Status:** Initial vision extracted from Matt Wynne and Elizabeth Ayer’s conversation on 4 September 2026

**Workshop:** Explore DDD 2026 — “Non-Authoritarian Team Practices: a Co-Created Handbook”

**Primary source:** [`docs/notes/2026-09-04-matt-elizabeth-idea-for-vibe-coded-app-to-accompany-our-explore-ddd-session.md`](docs/notes/2026-09-04-matt-elizabeth-idea-for-vibe-coded-app-to-accompany-our-explore-ddd-session.md)

## Vision

Enable a room full of workshop participants to turn handwritten pattern-writing work into a shared, durable online handbook while the workshop is still happening.

A participant should be able to take out their phone, open a web page without installing anything, and capture one team-practice pattern from a card, Post-it, sheet of paper, spoken explanation, or hand-drawn diagram. The tool should preserve the human character of the work while shaping it into a consistent, editable collection. Each contribution should become a discrete addition to a Git-backed body of Markdown and appear in a website that everyone can see.

The software is not intended to replace the collaborative, physical work in the room. Its role is to remove the clerical bottleneck between ideas produced by several groups and the co-created handbook those ideas are meant to become.

## The workshop context

Matt and Elizabeth are preparing an Explore DDD session called “Non-Authoritarian Team Practices: a Co-Created Handbook”. The session is, in effect, a pattern-writing workshop.

Participants will work in multiple groups, potentially in parallel. They will develop practices or patterns using physical materials such as:

- cards;
- Post-it notes;
- sheets of paper;
- handwritten text; and
- hand-drawn diagrams.

The workshop output should not remain as a pile of physical artifacts that someone must manually decipher and transcribe later. It should become a coherent handbook or compendium of the practices created in the room.

## The problem

The workshop deliberately uses low-friction physical materials because they are good for thinking and collaboration. Those materials are poor at becoming a shared, durable publication:

- contributions are distributed around the room;
- several groups may finish or revise work at the same time;
- handwriting and sketches must otherwise be transcribed manually;
- spoken context may never make it onto the card;
- the relationship between a card, its explanation, and its diagram can be lost;
- a collection of photographs is not yet a structured handbook; and
- post-workshop editing becomes laborious if the output is trapped in an app or an opaque format.

The desired product bridges that gap without making participants abandon the physical workshop or learn a complicated publishing system.

## Who it is for

### Workshop participants

Up to roughly 50 software practitioners or architects working in small groups. They are technically comfortable, but should not be asked to install software or follow a heavyweight workflow during the session.

### Workshop facilitators and editors

Matt, Elizabeth, and possibly other facilitators who need to see contributions arrive, notice gaps, and refine the collection during or after the workshop.

### Handbook readers and future contributors

People who want to browse the resulting catalogue of non-authoritarian team practices and, subject to the editing model eventually chosen, improve it after the event.

## The desired participant experience

A good end-to-end experience would be:

1. A participant follows a link or scans a QR code on their phone.
2. The browser opens directly to the workshop’s capture experience; no installation or account setup is required unless later testing proves it necessary.
3. The participant starts a contribution for one practice or pattern.
4. They capture what their group has made using one or more lightweight inputs:
   - photograph the written card, Post-it, or page;
   - photograph a hand-drawn diagram;
   - type or correct structured text; and/or
   - record a short spoken explanation.
5. The software uses those inputs to help populate a consistent pattern structure.
6. The participant can check that the resulting contribution says what the group intended.
7. They submit it without needing to understand Git or the handbook’s publishing machinery.
8. The contribution becomes a distinct change in the output repository and appears in the shared online collection.
9. Other people in the room can see the handbook taking shape while groups continue to work in parallel.
10. After the workshop, facilitators or contributors can refine the Markdown and images using ordinary Git-based tools.

Steps 1, 5, and 6 are design implications rather than verbatim requirements from the conversation. They should be validated, but they follow from the stated need for phone access, structured output, camera and voice capture, and a useful published handbook.

## The pattern being captured

The conversation identified the contribution as a **pattern** describing a software or team practice. The exact schema still needs refinement, but the headings discussed were:

- **Title** — the name of the practice or pattern.
- **Context / preconditions** — the situation in which the pattern applies and what needs to be true beforehand.
- **Method** — how to carry out the practice.
- **Consequences** — what happens afterward or what someone should expect to observe.

“Context” and “preconditions” were both mentioned. The team should decide whether these are separate fields or two names for the same part of the pattern.

A useful captured pattern may also include:

- the original photograph, retained as provenance;
- a human-drawn diagram;
- a lightly cleaned-up version of the diagram, if that can be done without removing its character;
- text derived from a spoken explanation;
- optional contributor or group information; and
- workshop/session metadata.

The metadata items are reasonable implementation implications, not decisions recorded in the source conversation.

## Core product capabilities

### 1. Zero-install mobile web access

The product should work through a phone browser. Participants are assumed to have:

- a phone;
- internet access;
- a camera; and
- a microphone.

They should not have to install new software.

### 2. Multimodal capture without a heavyweight interface

Text is essential, but text entry must not be the only route. The capture flow should be able to accept:

- photographs of written workshop artifacts;
- photographs of diagrams;
- direct text; and
- optional short voice recordings.

These modes should remain optional and composable. A participant should not be forced through every mode for every pattern.

### 3. Assistance turning raw inputs into structured text

Voice should be used to embellish or clarify the text in the final pattern, not merely stored as an isolated audio attachment. Likewise, photographs of writing should help produce structured content rather than becoming an unsearchable image dump.

The participant or an editor must remain able to correct the result. The group’s meaning matters more than automatic polish.

### 4. Respectful handling of human-drawn diagrams

The handbook should include diagrams where they help explain a practice. A diagram may be tidied slightly, but the desired aesthetic is recognizably human and messy—not a generic, over-polished, machine-generated replacement.

The product should preserve the original image even if it also creates a cleaned derivative, unless the team deliberately decides otherwise.

### 5. Parallel contribution

Several workshop groups may submit at the same time. Any visitor with the workshop link should be able to upload a contribution under the intentionally lightweight access model discussed in the conversation.

The system should avoid lost submissions and make each contribution independently identifiable.

### 6. A discrete Git-backed change for each contribution

A submitted pattern should map naturally to a distinct commit or similarly reviewable change in the output Git repository. Contributors should not need Git knowledge, but facilitators should gain Git’s useful properties:

- an editable, non-proprietary source;
- history and provenance;
- reviewable changes;
- straightforward correction after the workshop; and
- the ability to generate a website from the same source.

Whether submissions go straight to the primary branch, create pull requests, or enter a moderation queue remains open.

### 7. A visible, evolving handbook

The output should live on the internet where everyone can see it. Ideally the generated website updates quickly enough that participants can watch the handbook emerge during the workshop.

The collection should be structured around individual pattern cards or pages rather than presented as a chronological feed of uploads.

### 8. Durable, editable publishing format

The preferred direction is a GitHub-hosted repository containing Markdown or another lightweight text format, with a generated website representing the handbook. The precise documentation tool was not chosen. Markdown, AsciiDoc, and static-site/documentation generators are candidates, not settled requirements.

## Product principles

### Preserve the workshop, do not digitize it away

The creative work happens between people using cards, paper, conversation, and drawings. The product supports capture and publication; it should not force the whole workshop into forms and screens.

### Easy for the actual audience

The conversation explicitly framed “easy” as easy for software architects rather than a universal consumer-product standard. Even so, installation, repository setup, and Git operations should be hidden from workshop participants.

### Human meaning over automated polish

Automation should help with transcription, structure, and gentle cleanup. It should not rewrite contributions into bland prose or replace a meaningful hand-drawn diagram with synthetic artwork.

### Open and editable output

The handbook should outlive the capture tool. Text and images should be accessible in ordinary files and editable through familiar Git-based workflows.

### Workshop scale, not internet scale

The tool can be intentionally optimized for one workshop rather than designed as a large multi-tenant platform.

### Simple security appropriate to the event

The conversation explicitly rejected the need for elaborate security. A simple link-based or session-based model may be enough. This does not remove the need for basic safeguards against accidental overwrites, malformed uploads, or exposure of private recordings.

## Scale and operating assumptions

The initial design may assume:

- fewer than 50 participants;
- fewer than 100 patterns;
- a small number of groups contributing concurrently;
- a single workshop or a very small number of workshop sessions;
- working internet access in the room;
- modern phone browsers with camera and microphone access; and
- facilitators who are comfortable maintaining a Git repository afterward.

These constraints are a feature: they allow the first version to stay small and purpose-built.

## What the product is not

The initial product does not need to be:

- a native iOS or Android app;
- an enterprise-scale collaboration platform;
- a general-purpose content-management system;
- highly scalable beyond approximately 50 participants or 100 patterns;
- equipped with complex roles, permissions, or identity management;
- a replacement for GitHub or a documentation generator;
- a tool that generates polished AI artwork in place of participant drawings; or
- a complete digital workshop environment.

## A plausible first useful version

The smallest version that demonstrates the full idea should support one named workshop and one output repository. It should let a participant:

1. open a shared URL on a phone;
2. create one pattern with title, context/preconditions, method, and consequences;
3. attach a photograph of the group’s card or diagram;
4. optionally add a short spoken explanation;
5. review and correct the structured pattern;
6. submit it; and
7. see it appear in the shared handbook.

Behind the scenes, the system should:

1. store the original media safely;
2. derive editable text from images and speech where useful;
3. save the pattern in an ordinary text-based format;
4. associate images with the pattern;
5. create a discrete repository change; and
6. rebuild or update the public handbook site.

A simpler early prototype could validate the flow with typed text and image upload first, then add speech transcription and image cleanup. The important architectural test is that a phone submission can become a durable, visible, editable pattern without manual copying.

## Success looks like

During the workshop:

- participants begin contributing without installing software or learning Git;
- multiple groups can submit without blocking one another;
- the majority of a contribution can be captured from the artifacts and explanation the group already produced;
- each contribution has a consistent enough structure to browse as part of a handbook;
- human drawings remain recognizable and useful;
- no contribution is silently lost; and
- participants and facilitators can see the collection taking shape online.

After the workshop:

- the handbook exists independently of the capture interface;
- its source is understandable, editable, and versioned;
- facilitators can improve wording, structure, and images without exporting from a proprietary database;
- individual contributions and later edits can be traced; and
- the material is usable as a genuine compendium rather than merely an archive of photographs.

## Open questions to resolve

### Workshop and facilitation

- How will participants receive the workshop URL—QR code, short link, or both?
- Does each group create one pattern at a time, or maintain a group workspace?
- Should patterns appear immediately, or should a facilitator approve them first?
- What happens when two groups submit similar or overlapping patterns?
- Does the handbook need a live overview designed for projection in the room?
- What is the contingency if venue internet is unreliable?

### Pattern structure

- Are “context” and “preconditions” separate fields?
- Are title, context, method, and consequences all required?
- Are examples, forces, rationale, related patterns, or known uses needed?
- Can the schema evolve during the workshop without invalidating earlier submissions?
- Should contributors be able to link patterns to one another?

### Capture and editing

- Should the product extract handwriting automatically, or simply make transcription easier?
- How long may a voice explanation be?
- Must the participant review machine-derived text before submission?
- How should low-confidence transcription be shown?
- What does “tidying” a diagram mean in practice—crop, straighten, improve contrast, remove the background, or something more?
- Should both the original and cleaned image be published?
- Can a participant return to edit their submission after it is published?

### Identity, access, and safety

- Is possession of the workshop link sufficient authorization?
- Should contributions identify an individual, a group, neither, or both?
- How will accidental or inappropriate submissions be corrected?
- Are voice recordings retained after transcription?
- What consent, privacy, and data-retention notices are appropriate?
- What file-size and media-type limits are needed?

### Git and publishing

- Which repository hosts the handbook?
- Does each submission become a commit, a branch, a pull request, or an item in a moderated queue?
- Which branch is published?
- Which Markdown/static-site tool best represents a catalogue of patterns?
- How quickly must the generated site update?
- Who owns ongoing editorial responsibility?
- What licence should apply to the contributed handbook content and images?

## Product decisions recorded in the source conversation

The following points are directly grounded in the 4 September conversation:

- The product captures ideas written on cards, Post-its, or sheets of paper and turns them into a handbook or compendium.
- Participants will have phones and should not need to install software.
- Internet, a camera, and a microphone are assumed to be available.
- Voice may be used to add explanation to the final text.
- The online output should be visible to everyone and updatable.
- The output is structured around individual cards representing software or team practices.
- Patterns should be able to include human-drawn diagrams.
- Diagram cleanup should preserve the hand-drawn character rather than replacing it with unpleasant machine-generated imagery.
- The experience should support text, voice, and drawings without becoming complicated or heavyweight.
- The expected participants are software people, specifically framed as software architects.
- GitHub plus Markdown or a similar documentation format is the preferred direction for editable source.
- A website should be generated from the source repository.
- Multiple groups will work in parallel.
- Any workshop visitor should be able to upload under a simple access model.
- Each upload may map to a distinct commit in the output repository.
- The expected ceiling is approximately 100 patterns and 50 participants.
- Candidate pattern headings include title, preconditions/context, method, and consequences.
- The workshop is fundamentally a pattern-writing workshop.
- The product can use simple security and does not need an elaborate security model.

Everything beyond those points should be treated as a hypothesis to test with Matt, Elizabeth, and workshop participants.
