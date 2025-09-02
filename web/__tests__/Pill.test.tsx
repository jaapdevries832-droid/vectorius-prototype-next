import { render } from '@testing-library/react';
import Pill from '../components/Pill';

describe('Pill', () => {
  it('renders children', () => {
    const { getByText } = render(<Pill intent="info">Hello</Pill>);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
