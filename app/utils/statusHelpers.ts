export function getStatusColor(percentage: number) {
  if (percentage >= 80) {
    return {
      textColor: 'text-green-600',
      bgColor: 'bg-green-500',
      gradientFrom: '#10B981',
      gradientTo: '#34D399'
    };
  } else if (percentage >= 50) {
    return {
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      gradientFrom: '#F59E0B',
      gradientTo: '#FBBF24'
    };
  } else {
    return {
      textColor: 'text-red-600',
      bgColor: 'bg-red-500',
      gradientFrom: '#EF4444',
      gradientTo: '#F87171'
    };
  }
}

export function getStatusLabel(percentage: number) {
  if (percentage >= 85) {
    return 'Excellent';
  } else if (percentage >= 75) {
    return 'Good';
  } else if (percentage >= 65) {
    return 'Average';
  } else if (percentage >= 55) {
    return 'Below Average';
  } else {
    return 'Critical';
  }
}