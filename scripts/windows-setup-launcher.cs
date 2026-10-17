using System;
using System.Diagnostics;
using System.IO;
using System.Collections.Generic;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("MSIT Git Lab Setup")]
[assembly: AssemblyProduct("MSIT Git Lab")]
[assembly: AssemblyCompany("Master School Institute of Technology")]
[assembly: AssemblyDescription("MSIT Git Lab for Windows")]
[assembly: AssemblyVersion("1.0.0.0")]

internal static class WindowsSetupLauncher
{
    private const string ProcessName = "msit-git-lab";
    private const string SetupResource = "MSITGitLab.SquirrelSetup";
    private const int CloseTimeoutMilliseconds = 20000;

    [STAThread]
    private static int Main()
    {
        try
        {
            if (!CloseInstalledApp()) return 2;
            return RunSquirrelSetup();
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "Setup could not continue.\r\n\r\n" + error.Message,
                "MSIT Git Lab Setup",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }

    private static bool CloseInstalledApp()
    {
        bool closeApproved = false;
        while (true)
        {
            Process[] processes = FindInstalledProcesses();
            if (processes.Length == 0) return true;

            if (!closeApproved)
            {
                DialogResult answer = MessageBox.Show(
                    "MSIT Git Lab is open. Setup will close it, install the update, and reopen it. Save any work in the app, then choose Continue.",
                    "MSIT Git Lab Setup",
                    MessageBoxButtons.OKCancel,
                    MessageBoxIcon.Information);
                if (answer != DialogResult.OK)
                {
                    DisposeProcesses(processes);
                    return false;
                }
                closeApproved = true;
            }

            RequestClose(processes);
            DateTime deadline = DateTime.UtcNow.AddMilliseconds(CloseTimeoutMilliseconds);
            while (DateTime.UtcNow < deadline)
            {
                processes = FindInstalledProcesses();
                if (processes.Length == 0) return true;
                DisposeProcesses(processes);
                Thread.Sleep(250);
            }

            DialogResult retry = MessageBox.Show(
                "MSIT Git Lab is still closing. Choose Retry to keep waiting, or Cancel setup. No files will be removed until it has closed.",
                "MSIT Git Lab Setup",
                MessageBoxButtons.RetryCancel,
                MessageBoxIcon.Warning);
            if (retry != DialogResult.Retry) return false;
        }
    }

    private static Process[] FindInstalledProcesses()
    {
        string installRoot = Path.GetFullPath(Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MSITGitLab"));
        string installPrefix = installRoot.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        List<Process> matches = new List<Process>();
        foreach (Process process in Process.GetProcessesByName(ProcessName))
        {
            try
            {
                string executable = Path.GetFullPath(process.MainModule.FileName);
                if (executable.StartsWith(installPrefix, StringComparison.OrdinalIgnoreCase))
                    matches.Add(process);
                else
                    process.Dispose();
            }
            catch
            {
                process.Dispose();
            }
        }
        return matches.ToArray();
    }

    private static void RequestClose(Process[] processes)
    {
        foreach (Process process in processes)
        {
            try
            {
                if (!process.HasExited && process.MainWindowHandle != IntPtr.Zero)
                    process.CloseMainWindow();
            }
            catch (InvalidOperationException) { }
            finally { process.Dispose(); }
        }
    }

    private static void DisposeProcesses(Process[] processes)
    {
        foreach (Process process in processes) process.Dispose();
    }

    private static int RunSquirrelSetup()
    {
        string temporaryDirectory = Path.Combine(
            Path.GetTempPath(), "MSIT-Git-Lab-Setup-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(temporaryDirectory);
        string setupPath = Path.Combine(temporaryDirectory, "SquirrelSetup.exe");

        try
        {
            using (Stream resource = Assembly.GetExecutingAssembly().GetManifestResourceStream(SetupResource))
            {
                if (resource == null) throw new InvalidOperationException("The embedded installer could not be found.");
                using (FileStream output = File.Create(setupPath)) resource.CopyTo(output);
            }

            Process setup = Process.Start(new ProcessStartInfo
            {
                FileName = setupPath,
                WorkingDirectory = temporaryDirectory,
                UseShellExecute = true
            });
            if (setup == null) throw new InvalidOperationException("Windows could not start the embedded installer.");
            setup.WaitForExit();
            return setup.ExitCode;
        }
        finally
        {
            try { Directory.Delete(temporaryDirectory, true); }
            catch { }
        }
    }
}
