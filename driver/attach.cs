private IWebDriver Driver { get; set; }

// Some basic Selenium calls we’ll use in our tests
public void AttachToChrome()
{
    ChromeOptions options = new ChromeOptions();
    options.DebuggerAddress = "127.0.0.1:9222";

    // Using Polly library: https://github.com/App-vNext/Polly
    // Polly probably isn't needed in a single scenario like this, but can be useful in a broader automation project
    // Once we attach to Chrome with Selenium, use a WebDriverWait implementation
    var policy = Policy
      .Handle<InvalidOperationException>()
      .WaitAndRetry(10, t => TimeSpan.FromSeconds(1));

    policy.Execute(() => 
    {
        Driver = new ChromeDriver(options);
    });
}

// AttachToChromeTest.cs
[TestMethod]
public void LaunchChromeAndAttach()
{
    // Open WPF application, make sure a button is present, then click it to launch Chrome
    Assert.IsTrue(Window.LaunchBrowserButton.Displayed, 
        "Expected button never appears.");
    Window.LaunchBrowserButton.Click();

    // Attach to new Chrome instance
    Page.AttachToChrome();

    // Verify Chrome launched to the correct page
    Assert.AreEqual("https://intellitect.com/blog/", Page.Driver.Url);
    Assert.IsTrue(Page.BlogList.Displayed);
    Assert.IsTrue(Page.BlogHeadings.Count > 0);
}
private Window Window => new Window();
private PageUnderTest Page { get; } = new PageUnderTest();

