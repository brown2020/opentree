import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z.email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const treeSchema = z.object({
  name: z
    .string()
    .min(1, 'Tree name is required')
    .max(100, 'Tree name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

export const personSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  middleName: z
    .string()
    .max(50, 'Middle name must be less than 50 characters')
    .optional(),
  maidenName: z
    .string()
    .max(50, 'Maiden name must be less than 50 characters')
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  birthDate: z.date().optional().nullable(),
  birthPlace: z
    .string()
    .max(200, 'Birth place must be less than 200 characters')
    .optional(),
  deathDate: z.date().optional().nullable(),
  deathPlace: z
    .string()
    .max(200, 'Death place must be less than 200 characters')
    .optional(),
  isLiving: z.boolean(),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type TreeSchemaFormData = z.infer<typeof treeSchema>;
export type PersonSchemaFormData = z.infer<typeof personSchema>;
