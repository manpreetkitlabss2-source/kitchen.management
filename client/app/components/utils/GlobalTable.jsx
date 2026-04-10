/**
 * DEPRECATED: Use DataGrid component instead
 * This file is kept for backwards compatibility only
 * 
 * Migration guide:
 * OLD: <GlobalTable title="..." columns={[]} data={[]} onAddClick={() => {}} />
 * NEW: <DataGrid title="..." columns={[]} data={[]} onAddClick={() => {}} />
 * 
 * or use Table component from batch/common for advanced features
 */

import DataGrid from "./DataGrid";

export const GlobalTable = (props) => {
  console.warn(
    "GlobalTable is deprecated. Use DataGrid from components/utils/DataGrid.jsx instead."
  );
  return <DataGrid {...props} />;
};