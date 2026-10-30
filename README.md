<div align="center">

# Eatora

### A more thoughtful place to start.

Taste-led dining discovery for caregivers and the people they care for.

[Open Eatora](https://eatora.vercel.app/) · [Start planning](https://eatora.vercel.app/app) · [Qloo](https://www.qloo.com/) · [License](LICENSE)

</div>

---

## A better way to choose a place

Choosing where to eat can take more than finding a nearby restaurant. Eatora brings together a person's tastes and the practical details a caregiver needs to consider, so that the search begins with the person rather than a generic list.

Enter a few favorites, a location, and the needs that matter today. Eatora uses Qloo's cultural intelligence to find real places related to those tastes and presents a shortlist to explore.

## Using Eatora

1. Open [the planner](https://eatora.vercel.app/app) and enter three to five favorites, one per line. These can be artists, films, restaurants, or other familiar places.
2. Add a city or neighborhood, choose two or three practical needs, and add any foods to avoid or limit.
3. If a favorite has several possible matches, choose the one you meant. Eatora waits for your choice before searching for places.
4. Explore the shortlist. Open **See the details** for the specific needs, questions to ask, and contact links when available. Mark a place as checked or skip it.
5. Read **A general idea (not checked)** for a separate AI-generated comparison based on the same inputs.

The shortlist identifies needs that require confirmation. A place's category or listed dishes do not establish that a particular meal meets a dietary need; check the menu or contact the restaurant before deciding. Food notes are treated as exclusions, not medical advice.

## How Qloo powers the experience

[Qloo](https://www.qloo.com/) connects cultural interests across categories such as music, film, food, and places. Eatora uses its taste intelligence to make location-aware discoveries from the favorites a caregiver supplies:

- **Search** resolves favorites to Qloo entities and offers choices when a name is ambiguous.
- **Tags** resolves relevant venue categories and practical terms to Qloo's own identifiers.
- **Insights** returns places using the selected interests and location. Eatora checks the returned venue category and locality before building the shortlist.
- **Evidence** is drawn from the explainability data returned for each place when available. When a detailed reason is unavailable, Eatora says so.

The separate OpenAI comparison receives only the original favorites, location, and needs. It does not receive Qloo results and is labelled as an unchecked general idea.

## Run locally

Requirements: Node.js 20 or later and a Qloo API key. An OpenAI key enables the comparison.

```bash
git clone https://github.com/Datwebguy/Eatora.git
cd Eatora
```

Set the following environment variables on the server, using `.env.example` as a reference. Supply them through your shell or hosting provider; the application does not automatically load an `.env` file.

```bash
export QLOO_API_KEY="your-qloo-key"
export QLOO_BASE_URL="https://hackathon.api.qloo.com"
export OPENAI_API_KEY="your-openai-key"
export OPENAI_MODEL="gpt-4o-mini"
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` to use a different local port. Keep keys server-side and out of source control. The Qloo base URL above is specific to the supplied key environment; use the endpoint associated with your key.

Run the automated checks with:

```bash
npm test
```

## Built with

Node.js, JavaScript, Qloo Search, Tags and Insights, OpenAI, and Vercel. The interface uses a warm cream and orange palette, with light and dark modes for comfortable reading.

## License

Eatora is available under the [MIT License](LICENSE).
