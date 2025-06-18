const apiUrl = "https://opbento.edgexhq.tech/api/bento?n=Parth%20Kapoor&g=parthkapoor-dev&x=parthkapoor_te&l=parthkapoor08&i=https%3A%2F%2Fgithub.com%2Fparthkapoor-dev.png&p=parthkapoor.me&z=3db8f";
interface BentoResponse {
  url: string;
}

const fetchBentoUrl = async (apiUrl: string): Promise<string> => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BentoResponse = (await response.json()) as BentoResponse;
    return data.url;
  } catch (error) {
    console.error("Error fetching Bento URL:", error);
    throw error;
  }
};

// @ts-ignore
fetchBentoUrl(apiUrl);
