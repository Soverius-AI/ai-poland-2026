import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { App } from './app';

it('renders unknown download progress without interrupting preparation controls', async () => {
  await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();

  const ai = fixture.componentInstance.ai;
  ai.states.update((states) => ({
    ...states,
    image: { ...states.image, preparing: true, progress: undefined },
  }));
  await fixture.whenStable();

  const element: HTMLElement = fixture.nativeElement;
  const progress = element.querySelector('progress');
  expect(progress).not.toBeNull();
  expect(progress?.hasAttribute('value')).toBe(false);
  const controls = element.querySelectorAll<HTMLButtonElement>('.preparation button');
  expect([...controls].every((button) => button.disabled)).toBe(true);

  ai.states.update((states) => ({
    ...states,
    image: { ...states.image, progress: 0.25 },
  }));
  await fixture.whenStable();
  expect(progress?.value).toBe(0.25);
});
