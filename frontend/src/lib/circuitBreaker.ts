interface CircuitBreakerOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  fallbackMessage?: string;
}

export async function fetchWithCircuitBreaker(
  url: string,
  options: RequestInit,
  cbOptions: CircuitBreakerOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 5000,
    fallbackMessage = "Nossos servidores de IA estão momentaneamente sobrecarregados. Por favor, tente novamente em alguns instantes."
  } = cbOptions;

  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // If successful or client error (4xx) not meant for retry, return it
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }
      
      // If Rate Limited or Server Error, we throw to retry
      throw new Error(`Serviço temporariamente indisponível (Status: ${response.status})`);
      
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        // Build a synthetic Response to smoothly fallback without breaking the UI component
        console.error(`[CircuitBreaker] Failed after ${maxRetries} attempts:`, error);
        
        const fallbackBody = JSON.stringify({
          choices: [{ message: { content: fallbackMessage } }]
        });
        
        return new Response(fallbackBody, {
          status: 200, // Pretend it succeeded but with fallback message
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Exponential backoff
      console.warn(`[CircuitBreaker] Retrying API call, attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }
  
  // This will never be hit due to the fallback returned above, but fixes TS return paths.
  throw new Error("Conexão interrompida");
}
