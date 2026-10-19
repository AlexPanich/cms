<!-- Main Container -->
<main id="main-container">
    <!-- Hero Content -->
    <div class="bg-primary-dark-op">
        <section class="content content-full content-boxed overflow-hidden">
            <!-- Section Content -->
            <div class="push-100-t push-50 text-center">
                <h1 class="h2 text-white push-10">@yield('page_title')</h1>
            </div>
            <!-- END Section Content -->
        </section>
    </div>
    <!-- END Hero Content -->

    <!-- Content -->
    <div class="bg-white">
        <section class="content content-boxed">
            <!-- Section Content -->
            @yield('content')
            <!-- END Section Content -->
        </section>
    </div>
    <!-- END Content -->
</main>
<!-- END Main Container -->