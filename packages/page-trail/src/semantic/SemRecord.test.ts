import { describe, expect, it } from 'vitest';

import { SemRecord } from './SemRecord';

describe('SemRecord', () => {
    it('renders descriptor only', () => {
        expect(SemRecord.builder().withDescriptor('button').build().text()).toBe('Button');
    });

    it('renders payload, unique state, and context', () => {
        const record = SemRecord.builder()
            .withDescriptor('heading h1')
            .withPayload('Save changes')
            .addState('disabled')
            .addState('disabled')
            .addState('visible on initial screen')
            .withContext('header')
            .build();

        expect(record.text()).toBe(
            'Heading h1: Save changes. State: disabled, visible on initial screen. Context: header',
        );
    });

    it('renders labels with primary name and aliases', () => {
        const record = SemRecord.builder()
            .withDescriptor('button')
            .withLabels(['Save changes', 'Save', 'Save changes'])
            .withAction('click action')
            .build();

        expect(record.text()).toBe('Button. Name: Save changes. Also labeled: Save. Action: click action');
    });

    it('renders state from an array without duplicates', () => {
        const record = SemRecord.builder()
            .withDescriptor('text input')
            .withState(['required', 'required', 'currently visible'])
            .build();

        expect(record.text()).toBe('Text input. State: required, currently visible');
    });

    it('omits undefined optional values', () => {
        const record = SemRecord.builder()
            .withDescriptor('main content')
            .withPayload(undefined)
            .withContext(undefined)
            .build();

        expect(record.text()).toBe('Main content');
    });

    it('requires descriptor', () => {
        expect(() => SemRecord.builder().withPayload('Save changes').build()).toThrow('Descriptor is required');
    });
});
