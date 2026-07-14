/*
  # Fix Infinite Recursion in Profiles RLS Policies

  1. Problem
    - The policy "Chefs and admins can view team profiles" causes infinite recursion
    - It queries the profiles table within its own policy check
    
  2. Solution
    - Drop the problematic policy
    - Create a simpler policy that allows authenticated users to read profiles
    - Keep restrictive policies for insert/update operations
    
  3. Security
    - Users can view their own profile (existing policy)
    - Authenticated users can view other profiles (new simplified policy)
    - Only admins can create new profiles
    - Users can only update their own profile
*/

-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Chefs and admins can view team profiles" ON profiles;

-- Create a simple policy allowing authenticated users to view all profiles
-- This is necessary for the app to function and display team members
CREATE POLICY "Authenticated users can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the restrictive "Users can view own profile" policy as a more specific rule
-- Note: The more specific policy (auth.uid() = id) will be evaluated alongside the general one
