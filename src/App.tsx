const handleSummarize = async () => {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailText }),
  });

  const data = await response.json();

  if (data.error) {
    setSummary("Error: " + data.error);
  } else if (data.generated_responses) {
    setSummary(data.generated_responses[0]);
  } else if (Array.isArray(data) && data[0]?.generated_text) {
    setSummary(data[0].generated_text);
  } else {
    setSummary("No summary returned.");
  }
};
