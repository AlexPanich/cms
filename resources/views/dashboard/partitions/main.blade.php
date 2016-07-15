<main id="main-container">
    <!-- Page Header -->
    @include('dashboard.partitions.page-header')
    <!-- END Page Header -->

    <!-- Page Content -->
    <div class="content">
        <!-- My Block -->
        <div class="block">
            <div class="block-header bg-gray-lighter">
                <h3 class="block-title">@yield('content_title')</h3>
            </div>
            <div class="block-content">
                <p>
                    @yield('content')
                </p>
            </div>
        </div>
        <!-- END My Block -->
    </div>
    <!-- END Page Content -->
</main>