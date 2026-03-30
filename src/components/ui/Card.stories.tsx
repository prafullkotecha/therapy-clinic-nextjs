import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardBody, CardFooter, CardHeader } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: 'Card',
  },
  render: () => (
    <Card>
      <CardBody>Simple card content</CardBody>
    </Card>
  ),
};

export const WithHeaderAndFooter: Story = {
  args: {
    children: 'Card',
  },
  render: () => (
    <Card>
      <CardHeader>Card Header</CardHeader>
      <CardBody>Card body content</CardBody>
      <CardFooter>Card Footer</CardFooter>
    </Card>
  ),
};
