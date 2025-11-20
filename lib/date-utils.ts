export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jui', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (error) {
    // If there's an error, return the original date string
    return dateString;
  }
};