<header id="header-navbar" class="content-mini content-mini-full">
    <div class="content-boxed">
        <!-- Header Navigation Right -->
        <ul class="js-nav-main-header nav-main-header pull-right">
            <li class="text-left hidden-md hidden-lg">
                <!-- Toggle class helper (for main header navigation in small screens), functionality initialized in App() -> uiToggleClass() -->
                <button class="btn btn-link text-white" data-toggle="class-toggle" data-target=".js-nav-main-header"
                        data-class="nav-main-header-o" type="button">
                    <i class="fa fa-times"></i>
                </button>
            </li>
            <li>
                <a class="nav-submenu" href="javascript:void(0)">Меню</a>
                <ul>
                    @foreach($menu as $item)
                        <li @frontWidget(page, $item)class="
                            @if($item->is_active)
                                active
                            @endif
                                "><a @frontField(title_in_menu, input) href="/{{ $item->full_url }}">{{$item->title_in_menu}}</a>
                        </li>
                    @endforeach
                </ul>
            </li>
            <li>
                <a class="nav-submenu" href="javascript:void(0)">Дочернии страницы</a>
                <ul>
                    @foreach($child_menu as $item)
                        <li @frontWidget(page, $item) class="
                            @if($item->is_active)
                                active
                            @endif
                                "><a @frontField(title_in_menu, input) href="/{{ $item->full_url }}">{{$item->title_in_menu}}</a></li>
                    @endforeach
                </ul>
            </li>
        </ul>
        <!-- END Header Navigation Right -->

        <!-- Header Navigation Left -->
        <ul class="nav-header pull-left">
            <li class="header-content">
                <a class="h5" href="start_frontend.html">
                    <span class="h4 font-w600 text-white">@text(title)</span>
                </a>
            </li>
        </ul>
        <!-- END Header Navigation Left -->
    </div>
</header>