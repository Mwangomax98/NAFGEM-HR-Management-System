-- Allow employees to delete their own draft or pending timesheets
CREATE POLICY "Employees can delete their own draft or pending timesheets"
ON timesheets
FOR DELETE
USING (
  auth.uid() = employee_id 
  AND status IN ('draft', 'pending')
);

-- Update the UPDATE policy to also allow pending timesheets (not just draft)
DROP POLICY IF EXISTS "Employees can update their own draft timesheets" ON timesheets;

CREATE POLICY "Employees can update their own draft or pending timesheets"
ON timesheets FOR UPDATE
USING (auth.uid() = employee_id AND status IN ('draft', 'pending'))
WITH CHECK (auth.uid() = employee_id AND status IN ('draft', 'pending'));

-- Also allow employees to update/delete entries for draft or pending timesheets
DROP POLICY IF EXISTS "Employees can manage their own timesheet entries" ON timesheet_entries;

CREATE POLICY "Employees can manage their own timesheet entries"
ON timesheet_entries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM timesheets 
    WHERE timesheets.id = timesheet_entries.timesheet_id 
    AND timesheets.employee_id = auth.uid()
    AND timesheets.status IN ('draft', 'pending')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM timesheets 
    WHERE timesheets.id = timesheet_entries.timesheet_id 
    AND timesheets.employee_id = auth.uid()
    AND timesheets.status IN ('draft', 'pending')
  )
);