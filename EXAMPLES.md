# Demo Personas and Test Cases — Eatora

Use these to verify the backend. Do not hardcode the expected places.

## Persona 1 — Soft texture + low sodium

Favorites: “chicken soup”, “Italian restaurant”, “Frank Sinatra”, “Central Park”  
Location: “Brooklyn, NY”  
Constraints: Soft texture, Low-sodium  

Verify: resolution succeeds, Insights returns places, constraint filter removes or down-ranks non-matching items, evidence chips appear only from the Qloo payload.

## Persona 2 — Low-heat + medication note

Favorites: “Thai restaurant”, “green tea”, “yoga”  
Location: “Austin, TX”  
Constraints: Low-heat delivery, Avoid grapefruit  

Verify: spicy/high-heat tags are excluded in code, grapefruit-related items are filtered, evidence is present.

## Persona 3 — Pure-LLM comparison

Same inputs as Persona 1.  
Verify: both plans are shown. The LLM plan has no Qloo evidence and may name places that do not appear in the Qloo results.

## Persona 4 — Ambiguous name

Input: “Joe’s”  
Verify: agent returns search candidates and waits for user selection before calling Insights.

## Persona 5 — Empty or thin coverage

Location known to have sparse data.  
Verify: system reports empty or low results honestly. No invented places appear.
